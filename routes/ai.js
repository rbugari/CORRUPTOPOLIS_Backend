const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST api/ai/get-corruption-types
// @desc    Generate 10 corruption types for the roulette
// @access  Private
router.post('/get-corruption-types', authMiddleware, aiController.getCorruptionTypes);

// @route   POST api/ai/get-cards
// @desc    Generate 5 sub-options (cards)
// @access  Private
router.post('/get-cards', authMiddleware, aiController.getCards);

// @route   POST api/ai/evaluate-plan
// @desc    Evaluate the player's narrated plan
// @access  Private
router.post('/evaluate-plan', authMiddleware, aiController.evaluatePlan);

// @route   POST api/ai/generate-dev-plan
// @desc    (DEV-ONLY) Generate a plan for the player
// @access  Private
router.post('/generate-dev-plan', authMiddleware, aiController.generateDevPlan);

// @route   POST api/ai/generate-wildcard-plan
// @desc    Generate a wildcard plan for the player after watching an ad
// @access  Private
router.post('/generate-wildcard-plan', authMiddleware, aiController.generateWildcardPlan);

module.exports = router;
