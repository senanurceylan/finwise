/**
 * Canlı piyasa fiyatları — dış API zinciri + güvenli birleştirme.
 * Anahtarlar yalnızca backend config/.env üzerinden okunur.
 */

const COINGECKO_IDS = {
  bitcoin: 'BTCTRY',
  ethereum: 'ETHTRY',
  solana: 'SOLTRY',
  ripple: 'XRPTRY',
  cardano: 'ADATRY',
  'pax-gold': 'XAUTRY',
  'kinesis-silver': 'XAGTRY',
};

const SUPPORTED_MARKET_SYMBOLS = [
  'USDTRY',
  'EURTRY',
  'XAUTRY',
  'BTCTRY',
  'ETHTRY',
  'XAGTRY',
  'SOLTRY',
  'XRPTRY',
  'ADATRY',
];

function asNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function emptyPrices() {
  return Object.fromEntries(SUPPORTED_MARKET_SYMBOLS.map((s) => [s, null]));
}

/** TRY bazlı: API "1 TRY = rate USD" veriyorsa USD/TRY = 1/rate */
function tryRatesToUsdEurTry(rates) {
  const usdPerTry = asNumber(rates?.USD);
  const eurPerTry = asNumber(rates?.EUR);
  return {
    USDTRY: usdPerTry && usdPerTry > 0 ? 1 / usdPerTry : null,
    EURTRY: eurPerTry && eurPerTry > 0 ? 1 / eurPerTry : null,
  };
}

async function fetchForexFromExchangeApi(config) {
  if (!config.market?.exchangeApiKey) return null;
  const base = (config.market.exchangeApiBase || 'https://api.exchangeratesapi.io/v1').replace(/\/$/, '');
  const url = `${base}/latest?base=TRY&symbols=USD,EUR&apikey=${encodeURIComponent(config.market.exchangeApiKey)}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  return tryRatesToUsdEurTry(data?.rates);
}

async function fetchForexFromFrankfurter() {
  const url = 'https://api.frankfurter.app/latest?from=TRY&to=USD,EUR';
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  return tryRatesToUsdEurTry(data?.rates);
}

async function fetchForexFromOpenEr() {
  const url = 'https://open.er-api.com/v6/latest/TRY';
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  if (data?.result !== 'success' || !data?.rates) return null;
  return tryRatesToUsdEurTry(data.rates);
}

async function fetchForexMerged(config) {
  let usd = null;
  let eur = null;

  const primary = await fetchForexFromExchangeApi(config).catch(() => null);
  if (primary?.USDTRY != null) usd = primary.USDTRY;
  if (primary?.EURTRY != null) eur = primary.EURTRY;
  if (usd != null && eur != null) return { USDTRY: usd, EURTRY: eur };

  const frank = await fetchForexFromFrankfurter().catch(() => null);
  if (usd == null && frank?.USDTRY != null) usd = frank.USDTRY;
  if (eur == null && frank?.EURTRY != null) eur = frank.EURTRY;
  if (usd != null && eur != null) return { USDTRY: usd, EURTRY: eur };

  const openEr = await fetchForexFromOpenEr().catch(() => null);
  if (usd == null && openEr?.USDTRY != null) usd = openEr.USDTRY;
  if (eur == null && openEr?.EURTRY != null) eur = openEr.EURTRY;

  return { USDTRY: usd, EURTRY: eur };
}

async function fetchCryptoAndCommoditiesFromCoinGecko(config) {
  const ids = Object.keys(COINGECKO_IDS).join(',');
  const base = (config.market?.coinGeckoApiBase || 'https://api.coingecko.com/api/v3').replace(/\/$/, '');
  const url = `${base}/simple/price?ids=${ids}&vs_currencies=try`;
  const headers = {};
  if (config.market?.coinGeckoApiKey) {
    headers['x-cg-pro-api-key'] = config.market.coinGeckoApiKey;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) return {};
  const data = await response.json();
  const out = {};
  for (const [cgId, symbol] of Object.entries(COINGECKO_IDS)) {
    const v = asNumber(data?.[cgId]?.try);
    if (v != null) out[symbol] = v;
  }
  return out;
}

async function fetchGoldFromMetalsApi(config) {
  if (!config.market?.metalsApiKey) return null;
  const base = (config.market.metalsApiBase || 'https://metals-api.com/api').replace(/\/$/, '');
  const url = `${base}/latest?api_key=${encodeURIComponent(config.market.metalsApiKey)}&base=TRY&currencies=XAU`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  const xauRate = asNumber(data?.rates?.XAU);
  return xauRate && xauRate > 0 ? 1 / xauRate : null;
}

/**
 * Tüm sembolleri doldurır; hata olsa bile exception fırlatmaz.
 * @returns {{ prices: Record<string, number|null>, warnings: string[] }}
 */
async function fetchAllMarketPrices(config) {
  const warnings = [];
  const prices = emptyPrices();

  const [forexSettled, cryptoSettled, metalOverrideSettled] = await Promise.allSettled([
    fetchForexMerged(config),
    fetchCryptoAndCommoditiesFromCoinGecko(config),
    fetchGoldFromMetalsApi(config).catch(() => null),
  ]);

  if (forexSettled.status === 'fulfilled') {
    const f = forexSettled.value;
    if (f.USDTRY != null) prices.USDTRY = f.USDTRY;
    if (f.EURTRY != null) prices.EURTRY = f.EURTRY;
  }
  if (prices.USDTRY == null && prices.EURTRY == null) {
    warnings.push('Döviz kurları alınamadı (tüm kaynaklar denendi).');
  } else if (prices.USDTRY == null || prices.EURTRY == null) {
    warnings.push('Bir döviz kuru eksik.');
  }

  if (cryptoSettled.status === 'fulfilled') {
    Object.assign(prices, cryptoSettled.value);
  } else {
    warnings.push('Kripto ve emtia fiyatları alınamadı (CoinGecko).');
  }

  if (metalOverrideSettled.status === 'fulfilled' && metalOverrideSettled.value != null) {
    prices.XAUTRY = metalOverrideSettled.value;
  }

  for (const symbol of SUPPORTED_MARKET_SYMBOLS) {
    if (prices[symbol] != null && (!Number.isFinite(prices[symbol]) || prices[symbol] <= 0)) {
      prices[symbol] = null;
    }
  }

  return { prices, warnings };
}

module.exports = {
  SUPPORTED_MARKET_SYMBOLS,
  COINGECKO_IDS,
  fetchAllMarketPrices,
};
