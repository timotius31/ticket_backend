
const r=require('express').Router();
const c=require('../controllers/seatController');
r.get('/:floor',c.getSeats);
module.exports=r;
