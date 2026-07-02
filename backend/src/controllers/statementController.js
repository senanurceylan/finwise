const { analyzeStatementPdfBuffer } = require('../services/statementAnalysis');
const { indexStatementPdfBuffer } = require('../services/statementRagService');

async function analyze(req, res, next) {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ success: false, error: 'PDF dosyası zorunludur.' });
    }

    const result = await analyzeStatementPdfBuffer(req.file.buffer);

    let rag;
    try {
      rag = await indexStatementPdfBuffer({
        userId: req.userId,
        buffer: req.file.buffer,
        fileName: req.file.originalname,
      });
    } catch (error) {
      console.warn('[statement] RAG indexleme başarısız:', error.message);
      rag = { indexed: false, reason: 'index_failed', error: error.message };
    }

    return res.json({
      success: true,
      data: result,
      rag,
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
