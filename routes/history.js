const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET api/history/all
// @desc    Get all interactions for a user
// @access  Private
router.get('/all', authMiddleware, historyController.getAllInteractions);

// @route   POST api/history/add
// @desc    Add a new interaction
// @access  Private
router.post('/add', authMiddleware, historyController.addInteraction);

module.exports = router;
