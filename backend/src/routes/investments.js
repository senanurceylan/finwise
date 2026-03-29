const express = require('express');
const { authenticate } = require('../middlewares/auth');
const controller = require('../controllers/investmentController');

const router = express.Router();

router.use(authenticate);
router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
