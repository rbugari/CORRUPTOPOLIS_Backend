const express = require('express');
const router = express.Router();
const { 
  loadProgress, 
  reduceScandal, 
  resolveScandal,
  getAdConfig,
  saveProgress,
  getGameConfig,
  goPremium
} = require('../controllers/gameController');
const auth = require('../middleware/authMiddleware');

// @route   GET api/game/progress
// @desc    Load current user game state
// @access  Private
router.get('/progress', auth, loadProgress);

// @route   POST api/game/progress
// @desc    Save current user game state
// @access  Private
router.post('/progress', auth, saveProgress);

// @route   POST api/game/reduce-scandal
// @desc    Reduce BE by spending INF
// @access  Private
router.post('/reduce-scandal', auth, reduceScandal);
router.get('/config', auth, getGameConfig);

// @route   POST api/game/resolve-scandal
// @desc    Resolve scandal event
// @access  Private
router.post('/resolve-scandal', auth, resolveScandal);

// @route   POST api/game/go-premium
// @desc    Upgrade user to premium
// @access  Private
router.post('/go-premium', auth, goPremium);

// Nueva ruta para configuración de publicidad
router.get('/ad-config', auth, getAdConfig);

module.exports = router;
