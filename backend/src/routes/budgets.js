const express = require('express');
const budgetController = require('../controllers/budgetController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.get('/status', budgetController.status);
router.get('/', budgetController.list);
router.post('/', budgetController.create);
router.patch('/:category', budgetController.update);
router.delete('/:category', budgetController.remove);

module.exports = router;
