const { analyzeStatementPdfBuffer } = require('../services/statementAnalysis');

async function analyze(req, res, next) {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ success: false, error: 'PDF dosyası zorunludur.' });
    }

    const result = await analyzeStatementPdfBuffer(req.file.buffer);
    return res.json({
      success: true,
      data: result,
    });
  } catch (e) {
    if (e.statusCode) {
      return res.status(e.statusCode).json({ success: false, error: e.message });
    }
    return next(e);
  }
}

module.exports = {
  analyze,
};
