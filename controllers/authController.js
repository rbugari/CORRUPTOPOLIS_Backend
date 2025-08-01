const User = require('../models/User');
const UserGameState = require('../models/UserGameState');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../services/emailService');

exports.register = async (req, res) => {
  const { nickname, email, password, selected_language, country_of_origin, age, political_ideology, personal_profile } = req.body;

  try {
    // 1. Validar Nickname
    if (!nickname || nickname.length < 5) {
      return res.status(400).json({ msg: 'El nickname debe tener al menos 5 caracteres.' });
    }
    let existingUser = await User.findOne({ where: { nickname } });
    if (existingUser) {
      return res.status(400).json({ msg: 'El nickname ya está en uso. Por favor, elige otro.' });
    }
    existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        return res.status(400).json({ msg: 'El email ya está registrado.' });
    }

    // 2. Generar Código de Verificación
    const email_verification_code = crypto.randomInt(100000, 999999).toString();
    // console.log(`*** CÓDIGO DE VERIFICACIÓN PARA ${email}: ${email_verification_code} ***`);

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    let avatar_url = null;
    if (req.file) {
      avatar_url = `/uploads/avatars/${req.file.filename}`;
    }

    const user = await User.create({
      nickname,
      email,
      password_hash,
      avatar_url,
      selected_language,
      country_of_origin,
      age,
      political_ideology,
      personal_profile,
      email_verification_code,
      is_email_verified: false,
    });

    await UserGameState.create({ user_id: user.id });

    // 3. Enviar correo de verificación
    await sendVerificationEmail(user.email, email_verification_code);

    // 4. Enviar respuesta para solicitar verificación
    res.status(201).json({ msg: 'Registro exitoso. Por favor, verifica tu email con el código enviado.', email: user.email });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.verifyEmail = async (req, res) => {
    const { email, verificationCode } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ msg: 'Usuario no encontrado.' });
        }

        if (user.is_email_verified) {
            return res.status(400).json({ msg: 'El email ya ha sido verificado.' });
        }

        if (user.email_verification_code !== verificationCode) {
            return res.status(400).json({ msg: 'Código de verificación inválido.' });
        }

        // Marcar como verificado y limpiar el código
        user.is_email_verified = true;
        user.email_verification_code = null;
        await user.save();

        // Generar tokens para autologin
        const payload = { user: { id: user.id } };
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ msg: 'Email verificado correctamente.', accessToken, refreshToken });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.login = async (req, res) => {
  const { nickname, password } = req.body;

  try {
    let user = await User.findOne({ where: { nickname } });
    if (!user) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // Check if the user has already won the game
    console.log(`User ${user.nickname} has_won status: ${user.has_won}`);
    if (user.has_won) {
      return res.status(403).json({ msg: '¡Felicidades! Ya has ganado el juego y no puedes jugar de nuevo.', gameWon: true });
    }

    // Comprobar si el email está verificado
    if (!user.is_email_verified) {
      return res.status(401).json({ msg: 'Por favor, verifica tu email para poder iniciar sesión.', needsVerification: true, email: user.email });
    }

    // Comprobar si los términos y condiciones han sido aceptados
    if (!user.terms_accepted) {
      return res.status(401).json({ msg: 'Por favor, acepta los términos y condiciones para poder iniciar sesión.', needsTermsAcceptance: true, userId: user.id });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    await user.update({ last_login_timestamp: new Date() });

    const payload = { user: { id: user.id } };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ msg: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    const payload = { user: { id: decoded.user.id } };

    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Refresh token expired' });
    }
    res.status(401).json({ msg: 'Invalid refresh token' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
    });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateProfile = async (req, res) => {
  const { country_of_origin, age, political_ideology, personal_profile, avatar_url, selected_language } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.country_of_origin = country_of_origin;
    user.age = age;
    user.political_ideology = political_ideology;
    user.personal_profile = personal_profile;
    user.avatar_url = avatar_url;
    user.selected_language = selected_language;

    await user.save();

    res.json({ msg: 'Profile updated successfully', user: user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.acceptTerms = async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.terms_accepted = true;
    await user.save();

    const payload = { user: { id: user.id } };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ msg: 'Términos y condiciones aceptados correctamente.', accessToken, refreshToken });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updatePremiumStatus = async (req, res) => {
  try {
    // Only allow this in development mode
    if (process.env.DEBUG !== 'true') {
      return res.status(403).json({ msg: 'This endpoint is only available in development mode.' });
    }

    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    user.pagoTotal = true;
    await user.save();

    res.json({ msg: 'User premium status updated successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ msg: 'Usuario no encontrado.' });
    }

    if (user.is_email_verified) {
      return res.status(400).json({ msg: 'El email ya ha sido verificado.' });
    }

    const new_email_verification_code = crypto.randomInt(100000, 999999).toString();
    user.email_verification_code = new_email_verification_code;
    await user.save();

    await sendVerificationEmail(user.email, new_email_verification_code);

    res.json({ msg: 'Código de verificación reenviado correctamente.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};