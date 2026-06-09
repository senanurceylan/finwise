const { z } = require('zod');

const chatbotMessageSchema = z.object({
  message: z
    .string({ required_error: 'Mesaj gerekli.' })
    .trim()
    .min(1, 'Mesaj boş olamaz.')
    .max(500, 'Mesaj en fazla 500 karakter olabilir.'),
});

function validateChatbotMessage(body) {
  return chatbotMessageSchema.safeParse(body);
}

module.exports = {
  validateChatbotMessage,
};
