const express = require('express');
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', expenseController.list);
router.get('/:id', expenseController.getById);
router.post('/', expenseController.create);
router.put('/:id', expenseController.update);
router.delete('/:id', expenseController.remove);

module.exports = router;
