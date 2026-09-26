require("dotenv").config();
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth:{
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId:process.env.CLIENT_ID,
        clientSecret:process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

transporter.verify((error , success) => {
    if(error){
        console.error('Error connecting to email server:' , error);

    }else{
        console.log('Email server is ready to send messages');
    }
})
const sendEmail = async (to, subject, text, html) => {
    try {
      const info = await transporter.sendMail({
        from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
        to, // list of receivers
        subject, // Subject line
        text, // plain text body
        html, // html body
      });
  
      console.log('Message sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  async function sendRegisterEmail(userEmail , name){
    console.log("sendRegisteredEmail" , userEmail);


const subject = 'Welcome to Backend Ledger';

const text = `Hello ${name} , \n\n Thank you for registering at Backend Ledger,
We're exicted to have you on Board! \n\n Best regards , \n The Backend Ledger Team`;

const html = `<p>Hello ${name}, </p><p>Thank you for registering at Backend Ledger, 
We are exicted to have you on board! </p><p>Best regards , <br> The backend Ledger Team</p>`


await sendEmail(userEmail , subject, text, html);
console.log("✅ sendRegisterEmail finished");
}
async function sendTransictionEmail(userEmail , name , fromAccount , toAccount ){
  const subject = "Transiction Succesfull!"
  const text = `Hello ${name}, \n\n Your transiction of $${fromAccount} to a $${toAccount} was succesfull,/n/n Best Regards, \n The Backend Ledger Team`;
  const html =`<p>Hello ${name} </p><p> Your Transiction of $${fromAccount} to a $${toAccount} was succesfull,/n/n Best Regards,</p> <p>Best Regards</p> <p>The Backend Ledger Team</p>`;
  await sendEmail(userEmail, subject,text,html);
}
async function sendTransictionEmailFail(userEmail , name, fromAccount , toAccount){
  const subject = "Transsiction Failed";
  const text = `Hello ${name} , \n\n We are sorry to inform you that your transiction of $${fromAccount} to a $${toAccount} has failed. Please check your account balance and try again. \n\n Best Regards, \n The Backend Ledger Team`;
  const html = `<p>Hello ${name}, </p><p> We are sorry to inform you that your transiction of $${fromAccount} to a $${toAccount} has failed. Please check your account balance and try again. </p><p>Best Regards,</p><p>The Backend Ledger Team</p>`;
  await sendEmail(userEmail, subject, text, html);
  
}
module.exports = {
    sendRegisterEmail,
    sendTransictionEmail,
    sendTransictionEmailFail 
}; 
