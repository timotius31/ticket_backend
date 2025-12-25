
const nodemailer = require('nodemailer');
module.exports.sendMail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    host:'smtp.example.com',
    port:587,
    auth:{user:'user',pass:'pass'}
  });
  await transporter.sendMail({from:'ticket@app.com',to,subject,text});
};
