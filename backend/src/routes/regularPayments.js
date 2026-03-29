const express = require('express');
const controller = require('../controllers/regularPaymentController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);
router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id/mark-paid', controller.markPaid);
router.delete('/:id', controller.remove);

module.exports = router;
