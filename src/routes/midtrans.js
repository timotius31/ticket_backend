const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/callback', async (req, res) => {
  const { order_id, transaction_status } = req.body;

  if (transaction_status === 'settlement') {
    await db.query(
      `UPDATE orders SET status='paid' WHERE order_id=?`,
      [order_id]
    );

    await db.query(
      `UPDATE seats
       SET status='sold', reserved_until=NULL
       WHERE status='reserved'`
    );
  }

  res.sendStatus(200);
});

module.exports = router;
