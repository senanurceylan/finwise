const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./docs/openapi.json');
const config = require('./config');
const { errorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const regularPaymentRoutes = require('./routes/regularPayments');
const marketRoutes = require('./routes/market');
const investmentRoutes = require('./routes/investments');
const cardRoutes = require('./routes/cards');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.' },
});
app.use('/auth', authLimiter);

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
});
app.use('/expenses', apiLimiter);
app.use('/regular-payments', apiLimiter);
app.use('/market', apiLimiter);
app.use('/investments', apiLimiter);
app.use('/cards', apiLimiter);

app.get('/', (req, res) => {
  res.json({ message: 'FinWise API', version: '2.0', docs: '/api-docs' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: 'FinWise API Docs' }));

app.use('/auth', authRoutes);
app.use('/expenses', expenseRoutes);
app.use('/regular-payments', regularPaymentRoutes);
app.use('/market', marketRoutes);
app.use('/investments', investmentRoutes);
app.use('/cards', cardRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Kaynak bulunamadı.' });
});

app.use(errorHandler);

module.exports = app;
