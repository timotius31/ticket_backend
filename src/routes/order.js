
const r=require('express').Router();
const c=require('../controllers/orderController');
r.post('/reserve',c.reserve);
module.exports=r;
