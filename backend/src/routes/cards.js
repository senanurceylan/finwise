const express = require('express');
const { authenticate } = require('../middlewares/auth');
const cardController = require('../controllers/cardController');

const router = express.Router();
router.use(authenticate);

router.get('/', cardController.list);
router.post('/', cardController.create);
router.put('/:id', cardController.update);
router.delete('/:id', cardController.remove);

module.exports = router;
