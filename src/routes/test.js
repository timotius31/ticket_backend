const express = require('express');
const router = express.Router();
const db = require('../config/db');
const snap = require('../config/midtrans');
const { v4: uuidv4 } = require('uuid');

router.post('/', async (req, res) => {
  const { seats } = req.body;

  if (!seats || seats.length === 0)
    return res.status(400).json({ error: 'No seats selected' });

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // lock seats
    const seatCodes = seats.map(s => s.seat_code);

    const [rows] = await conn.query(
      `SELECT * FROM seats
       WHERE seat_code IN (?) AND status='available'
       FOR UPDATE`,
      [seatCodes]
    );

    if (rows.length !== seatCodes.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'Some seats already taken' });
    }

    await conn.query(
      `UPDATE seats
       SET status='reserved',
           reserved_until=DATE_ADD(NOW(), INTERVAL 5 MINUTE)
       WHERE seat_code IN (?)`,
      [seatCodes]
    );

    const total = seats.reduce((s, x) => s + x.price, 0);
    const orderId = 'ORDER-' + uuidv4();

    await conn.query(
      `INSERT INTO orders (order_id,total) VALUES (?,?)`,
      [orderId, total]
    );

    const snapToken = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: total
      }
    });

    await conn.commit();

    res.json({
      token: snapToken.token,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
