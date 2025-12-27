var express = require('express');
var router = express.Router();

// Greeting API
router.get('/', function (req, res) {
  res.send('Hello \n Selamat datang di API');
});

module.exports = router;