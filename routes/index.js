const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('This is the index page for the routes.');
});

module.exports = router;
