const z = require('zod');

const registerSchema = z.object({
  name: z.string().min(1, 'Ad gerekli.').max(100).trim(),
  email: z.string().email('Geçerli bir e-posta girin.').toLowerCase().trim(),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı.').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta girin.').toLowerCase().trim(),
  password: z.string().min(1, 'Şifre gerekli.'),
});

function validateRegister(body) {
  return registerSchema.safeParse(body);
}

function validateLogin(body) {
  return loginSchema.safeParse(body);
}

module.exports = { validateRegister, validateLogin };
