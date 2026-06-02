const express = require('express');
const multer = require('multer');
const statementController = require('../controllers/statementController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    const err = new Error('Sadece PDF dosyası yüklenebilir.');
    err.statusCode = 400;
    return cb(err);
  },
});

router.use(authenticate);
router.post('/analyze', upload.single('pdf'), statementController.analyze);

module.exports = router;
