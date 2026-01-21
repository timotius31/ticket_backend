require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();

app.set('trust proxy', 1);

/*app.use(cors({
  origin: [
    'http://localhost:5174',
    'https://app.sandbox.midtrans.com'
  ],
  methods: ['GET','POST'],
  allowedHeaders: ['Content-Type','Authorization']
})); */

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// DB health check
(async () => {
  try {
    await db.query('SELECT 1');
    console.log('✅ MySQL connected');
  } catch (e) {
    console.error('❌ MySQL error:', e.message);
  }
})();

// Routes
app.use('/seats', require('./routes/seats'));
app.use('/checkout', require('./routes/checkout'));
app.use('/midtrans', require('./routes/midtrans'));

// (Optional — keep only if you actually use them)
// app.use('/order', require('./routes/order'));
// app.use('/payment', require('./routes/payment'));

app.listen(3001, () => {
  console.log('API running on http://localhost:3001');
});
