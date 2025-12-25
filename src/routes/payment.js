
const r=require('express').Router();
const c=require('../controllers/paymentController');
r.post('/create',c.create);
r.post('/callback',c.callback);
module.exports=r;
