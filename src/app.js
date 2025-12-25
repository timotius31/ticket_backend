const express = require('express');
const cors = require('cors');
const db = require('./config/db'); // ✅ FIX

const app = express();

app.use(cors({
  origin: 'http://localhost:5174'
}));

app.use(express.json());

// ✅ DB health check
(async () => {
  try {
    await db.query('SELECT 1');
    console.log('✅ MySQL connected');
  } catch (e) {
    console.error('❌ MySQL error:', e.message);
  }
})();

app.use('/seats', require('./routes/seats'));
app.use('/order', require('./routes/order'));
app.use('/payment', require('./routes/payment'));

app.listen(3001, () => {
  console.log('API running on http://localhost:3001');
});
