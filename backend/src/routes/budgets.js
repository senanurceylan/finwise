const express = require('express');
const budgetController = require('../controllers/budgetController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', budgetController.create);
router.get('/status', budgetController.status);

module.exports = router;
