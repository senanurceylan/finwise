const { validateChatbotMessage } = require('../validators/chatbotValidator');
const { buildReply } = require('../services/chatbotService');

async function message(req, res, next) {
  const parsed = validateChatbotMessage(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: parsed.error.errors[0]?.message || 'Geçersiz veri.',
      details: parsed.error.errors,
    });
  }

  try {
    const reply = await buildReply(req.userId, parsed.data.message);
    return res.json({ reply });
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  message,
};
