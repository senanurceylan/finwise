const jwt = require('jsonwebtoken');
const config = require('../config');
const { prisma } = require('../utils/prisma');

/**
 * Authorization: Bearer <token> header'ını doğrular,
 * req.user ve req.userId set eder.
 * Token yoksa veya geçersizse 401 döner.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Yetkilendirme gerekli.' });
  }

  const token = authHeader.slice(7);
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Oturum geçersiz veya süresi doldu.' });
  }

  req.userId = decoded.userId;
  req.userRole = decoded.role || 'USER';

  // İsteğe bağlı: her istekte kullanıcıyı DB'den çekmek (güncel role vb. için)
  prisma.user
    .findUnique({ where: { id: decoded.userId }, select: { id: true, email: true, name: true, role: true } })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ success: false, error: 'Kullanıcı bulunamadı.' });
      }
      req.user = user;
      next();
    })
    .catch(next);
}

module.exports = { authenticate };
