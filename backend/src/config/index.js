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
  market: {
    cacheTtlMs: parseInt(process.env.MARKET_CACHE_TTL_MS || '60000', 10),
    exchangeApiKey: process.env.EXCHANGE_API_KEY || '',
    exchangeApiBase: process.env.EXCHANGE_API_BASE || 'https://api.exchangeratesapi.io/v1',
    coinGeckoApiBase: process.env.COINGECKO_API_BASE || 'https://api.coingecko.com/api/v3',
    coinGeckoApiKey: process.env.COINGECKO_API_KEY || '',
    metalsApiKey: process.env.METALS_API_KEY || '',
    metalsApiBase: process.env.METALS_API_BASE || 'https://metals-api.com/api',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
};
