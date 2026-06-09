const express = require('express');
const chatbotController = require('../controllers/chatbotController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.post('/message', chatbotController.message);

module.exports = router;
