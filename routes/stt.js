
const express = require('express');
const router = express.Router();
const sttController = require('../controllers/sttController');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/transcribe', upload.single('audio'), sttController.transcribeAudio);

module.exports = router;
