/**
 * Merkezi hata yönetimi.
 * Validation, auth, not found ve genel hataları tutarlı JSON yanıtına çevirir.
 */
function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Beklenmeyen bir hata oluştu.';

  // Prisma hataları
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, error: 'Kayıt bulunamadı.' });
  }
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, error: 'Bu e-posta adresi zaten kullanılıyor.' });
  }

  // Zod validation
  if (err.name === 'ZodError') {
    const details = err.errors?.map((e) => ({ path: e.path?.join('.'), message: e.message })) || [];
    return res.status(400).json({ success: false, error: 'Geçersiz veri.', details });
  }

  // JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Oturum geçersiz veya süresi doldu.' });
  }

  // Hassas bilgi sızdırmamak için production'da genel mesaj
  const safeMessage = req.app.get('env') === 'production' && status === 500 ? 'Sunucu hatası.' : message;

  res.status(status).json({ success: false, error: safeMessage });
}

module.exports = { errorHandler };
