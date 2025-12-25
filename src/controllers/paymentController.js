
const snap = require('../config/midtrans');
const db = require('../config/db');
const {sendMail} = require('../utils/email');

exports.create = async (req,res)=>{
  const {orderId,total} = req.body;
  const trx = await snap.createTransaction({
    transaction_details:{order_id:orderId,gross_amount:total}
  });
  res.json(trx);
};

exports.callback = async (req,res)=>{
  if(req.body.transaction_status==='settlement'){
    await db.query('UPDATE orders SET status="paid" WHERE order_id=?',[req.body.order_id]);
    await db.query(`
      UPDATE seats s JOIN order_seats os ON s.seat_code=os.seat_code
      SET s.status='sold' WHERE os.order_id=?
    `,[req.body.order_id]);
    await sendMail('customer@mail.com','Ticket Paid','Your payment is successful');
  }
  res.sendStatus(200);
};
