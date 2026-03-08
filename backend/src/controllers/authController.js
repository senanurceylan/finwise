const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Prisma } = require('@prisma/client');
const config = require('../config');
const { prisma } = require('../utils/prisma');
const { validateRegister, validateLogin } = require('../validators/authValidator');

async function register(req, res, next) {
  const parsed = validateRegister(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || 'Geçersiz veri.', details: parsed.error.errors });
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'USER' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    return res.status(201).json({ success: true, user, token });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Bu e-posta adresi zaten kullanılıyor.' });
    }
    return next(e);
  }
}

async function login(req, res, next) {
  const parsed = validateLogin(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || 'Geçersiz veri.' });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ success: false, error: 'E-posta veya şifre hatalı.' });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
  return res.json({ success: true, user: safeUser, token });
}

async function me(req, res) {
  return res.json({ success: true, user: req.user });
}

module.exports = { register, login, me };
