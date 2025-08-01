const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: 'corruptopia_ai_verify@over55it.com',
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (toEmail, verificationCode) => {
  const mailOptions = {
    from: 'corruptopia_ai_verify@over55it.com',
    to: toEmail,
    subject: 'Verificación de Correo Electrónico para Corruptopolis IA',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Verificación de Correo Electrónico</h2>
        <p>Gracias por registrarte en Corruptopolis IA. Para activar tu cuenta, por favor usa el siguiente código de verificación:</p>
        <p style="font-size: 24px; font-weight: bold; color: #0056b3;">${verificationCode}</p>
        <p>Si no solicitaste esta verificación, por favor ignora este correo.</p>
        <p>Saludos cordiales,</p>
        <p>El equipo de Corruptopolis IA</p>
        <p style="font-size: 12px; color: #888;">Por favor, no respondas a este correo electrónico, ya que esta dirección no es monitoreada.</p>
        <p style="font-size: 10px; color: #aaa;">© 2025 Corruptopolis IA. Todos los derechos reservados. Este juego es propiedad de over55it.com y está protegido por las leyes de derechos de autor de los Estados Unidos y tratados internacionales.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${toEmail}`);
  } catch (error) {
    console.error(`Error sending verification email to ${toEmail}:`, error);
    throw new Error('Failed to send verification email.');
  }
};

module.exports = { sendVerificationEmail };
