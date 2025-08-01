const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const { sequelize } = require('../config/db'); // Importar sequelize

// Configuración de Multer para el almacenamiento de avatares
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
    // Asegurarse de que el directorio exista
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Filtro de archivos para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG o GIF.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1 }, // Límite de 1MB
  fileFilter: fileFilter,
});

// @route   PUT /api/upload/avatar
// @desc    Cargar o actualizar el avatar del usuario
// @access  Private
router.put('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('[Upload] req.file es undefined o null. No se ha recibido el archivo.');
      return res.status(400).json({ msg: 'No se ha proporcionado ningún archivo.' });
    }

    const userId = req.user.id; // Obtener el ID del usuario autenticado
    const newAvatarUrl = `/uploads/avatars/${req.file.filename}`;

    let user = await User.findByPk(userId); // Cargar la instancia del usuario
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado.' });
    }

    // Guardar la URL del avatar antiguo antes de actualizar
    const oldAvatarUrl = user.avatar_url;

    console.log(`[Upload] User ID: ${userId}, Old Avatar URL (antes de actualizar): ${oldAvatarUrl}, New Avatar URL: ${newAvatarUrl}`);

    user.avatar_url = newAvatarUrl;
    user.changed('avatar_url', true); // Forzar a Sequelize a reconocer el cambio
    await user.save(); // Guardar la instancia

    console.log(`[Upload] Avatar URL (después de user.save()): ${user.avatar_url}`);

    // Eliminar el avatar antiguo si existe y es diferente al nuevo
    if (oldAvatarUrl && oldAvatarUrl !== newAvatarUrl) {
      const oldAvatarPath = path.join(__dirname, '..', 'public', oldAvatarUrl);
      fs.unlink(oldAvatarPath, (err) => {
        if (err) console.error('Error eliminando avatar antiguo:', err);
      });
    }

    res.json({ msg: 'Avatar actualizado exitosamente.', avatar_url: newAvatarUrl });
  } catch (err) {
    console.error(err.message);
    if (err instanceof multer.MulterError) {
      let msg = 'Error al subir el archivo.';
      if (err.code === 'LIMIT_FILE_SIZE') {
        msg = 'El archivo es demasiado grande. Máximo 1MB.';
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        msg = 'Demasiados archivos o nombre de campo incorrecto.';
      }
      return res.status(400).json({ msg: msg });
    }
    res.status(500).json({ msg: 'Error interno del servidor al subir el avatar.' });
  }
});

module.exports = router;
