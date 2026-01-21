const express = require('express');
const router = express.Router();
const db = require('../config/db');
const snap = require('../config/midtrans');
const { v4: uuidv4 } = require('uuid');

router.post('/', async (req, res) => {
  const { seats } = req.body; // array of seat_code

  if (!seats || !seats.length) {
    return res.status(400).json({ error: 'No seats selected' });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ Release expired reservations
    await conn.query(`
      UPDATE seats
      SET status = 'available',
          reserved_until = NULL
      WHERE status = 'reserved'
        AND reserved_until < NOW()
    `);

    // 2️⃣ Lock requested seats
    const [available] = await conn.query(
      `
      SELECT seat_code, price
      FROM seats
      WHERE seat_code IN (?)
        AND status = 'available'
      FOR UPDATE
      `,
      [seats]
    );

    // 🔴 CRITICAL CHECK
    if (available.length !== seats.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'Some seats already taken' });
    }

    // 3️⃣ Reserve seats for 5 minutes
    await conn.query(
      `
      UPDATE seats
      SET status = 'reserved',
          reserved_until = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
      WHERE seat_code IN (?)
      `,
      [seats]
    );

    // 4️⃣ Calculate total from DB (SAFE)
    const total = available.reduce((sum, s) => sum + s.price, 0);

    // 5️⃣ Create order
    const orderId = `ORDER-${uuidv4()}`;

    await conn.query(
      `INSERT INTO orders (order_id, total, status)
       VALUES (?, ?, 'pending')`,
      [orderId, total]
    );

    // 6️⃣ Midtrans
    const snapToken = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: total
      }
    });

    await conn.commit();

    res.json({
      token: snapToken.token,
      orderId
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
