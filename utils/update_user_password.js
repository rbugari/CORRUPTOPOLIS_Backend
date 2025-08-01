const { sequelize } = require('../config/db');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function updateUserPassword(nickname, newPassword) {
  try {
    // Sincronizar modelos para asegurar que la tabla User está disponible
    await sequelize.sync(); 

    const user = await User.findOne({ where: { nickname: nickname } });

    if (!user) {
      console.error(`Error: Usuario con nickname '${nickname}' no encontrado.`);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password_hash = hashedPassword;
    await user.save();

    console.log(`Contraseña del usuario '${nickname}' actualizada exitosamente.`);
  } catch (error) {
    console.error('Error al actualizar la contraseña:', error);
  } finally {
    await sequelize.close();
  }
}

// Obtener argumentos de la línea de comandos
const nickname = process.argv[2];
const newPassword = process.argv[3];

if (!nickname || !newPassword) {
  console.log('Uso: node update_user_password.js <nickname> <nueva_contraseña>');
  process.exit(1);
}

updateUserPassword(nickname, newPassword);
