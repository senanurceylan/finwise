/**
 * Uygulama konfigürasyonu.
 * Hassas değerler .env üzerinden okunur.
 */
require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
};
