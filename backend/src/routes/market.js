const express = require('express');
const { authenticate } = require('../middlewares/auth');
const marketController = require('../controllers/marketController');

const router = express.Router();

router.use(authenticate);
router.get('/prices', marketController.getPrices);

module.exports = router;
