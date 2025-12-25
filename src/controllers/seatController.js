
const db = require('../config/db');
exports.getSeats = async (req,res)=>{
  const [rows] = await db.query(
    'SELECT * FROM seats WHERE floor=?',[req.params.floor]
  );
  res.json(rows);
};
