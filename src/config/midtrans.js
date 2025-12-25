
const midtransClient = require('midtrans-client');
module.exports = new midtransClient.Snap({
  isProduction:false,
  serverKey:'MIDTRANS_SERVER_KEY'
});
