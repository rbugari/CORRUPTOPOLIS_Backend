const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de Multer para el almacenamiento de avatares durante el registro
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
    // Asegurarse de que el directorio exista
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generar un nombre de archivo único sin depender de req.user.id
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-reg-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Filtro de archivos para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']; // Añadir webp
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG, GIF o WEBP.'), false);
  }
};

const registerUpload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 2 }, // Límite de 2MB (como en el frontend)
  fileFilter: fileFilter,
});

module.exports = registerUpload;
