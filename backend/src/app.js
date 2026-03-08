const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { errorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');

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

app.get('/', (req, res) => {
  res.json({ message: 'FinWise API', version: '2.0' });
});

app.use('/auth', authRoutes);
app.use('/expenses', expenseRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Kaynak bulunamadı.' });
});

app.use(errorHandler);

module.exports = app;
