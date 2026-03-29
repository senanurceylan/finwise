const config = require('../config');
const { SUPPORTED_MARKET_SYMBOLS, fetchAllMarketPrices } = require('../services/marketPrices');

const CACHE_TTL_MS = Number(config.market?.cacheTtlMs || 60_000);

let cache = {
  prices: null,
  expiresAt: 0,
  fetchedAt: null,
  warnings: [],
};

async function getPrices(req, res) {
  const now = Date.now();
  if (cache.prices && cache.expiresAt > now) {
    return res.json({
      success: true,
      source: 'cache',
      fetchedAt: cache.fetchedAt,
      prices: cache.prices,
      warnings: cache.warnings?.length ? cache.warnings : undefined,
    });
  }

  try {
    const { prices, warnings } = await fetchAllMarketPrices(config);
    const fetchedAt = new Date(now).toISOString();
    cache = {
      prices,
      expiresAt: now + CACHE_TTL_MS,
      fetchedAt,
      warnings,
    };
    return res.json({
      success: true,
      source: 'live',
      fetchedAt,
      prices,
      warnings: warnings?.length ? warnings : undefined,
    });
  } catch (err) {
    if (cache.prices) {
      return res.json({
        success: true,
        source: 'cache-stale',
        stale: true,
        fetchedAt: cache.fetchedAt,
        prices: cache.prices,
        warnings: ['Canlı veri alınamadı; önbellekteki son değerler gösteriliyor.', ...(cache.warnings || [])],
      });
    }
    return res.json({
      success: true,
      source: 'empty',
      fetchedAt: new Date(now).toISOString(),
      prices: Object.fromEntries(SUPPORTED_MARKET_SYMBOLS.map((s) => [s, null])),
      warnings: ['Piyasa verisi şu an alınamadı.'],
    });
  }
}

module.exports = {
  SUPPORTED_MARKET_SYMBOLS,
  getPrices,
};
