
const db = require('../config/db');
const {v4:uuid} = require('uuid');

exports.reserve = async (req,res)=>{
  const {seats,email} = req.body;
  const conn = await db.getConnection();
  try{
    await conn.beginTransaction();
    const [rows] = await conn.query(
      'SELECT * FROM seats WHERE seat_code IN (?) AND status="available" FOR UPDATE',
      [seats]
    );
    if(rows.length!==seats.length) throw 'Seat taken';
    const orderId = uuid();
    const expire = new Date(Date.now()+5*60000);
    await conn.query(
      'INSERT INTO orders(order_id,email,total_price) VALUES (?,?,?)',
      [orderId,email,rows.reduce((s,x)=>s+x.price,0)]
    );
    for(const s of seats){
      await conn.query(
        'UPDATE seats SET status="reserved",reserved_until=? WHERE seat_code=?',
        [expire,s]
      );
      await conn.query(
        'INSERT INTO order_seats(order_id,seat_code) VALUES (?,?)',
        [orderId,s]
      );
    }
    await conn.commit();
    res.json({orderId});
  }catch(e){
    await conn.rollback();
    res.status(400).json({error:e});
  }finally{
    conn.release();
  }
};
