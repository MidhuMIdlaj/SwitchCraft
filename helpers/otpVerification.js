const nodemailer = require('nodemailer')
 
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
    },
});

const generateOTP = () =>{
    return Math.floor(100000 + Math.random() * 900000);
      
}

  const sendingMail=(email,otp, req, res)=>{ 
        const transporter = nodemailer.createTransport({
        service: "gmail", 
        auth: {
        user : process.env.EMAIL,
        pass : process.env.PASS
        },
        });   
        const mailOptions = {
            from : process.env.EMAIL,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP code is ${otp}`,
        };
        transporter.sendMail(mailOptions, (error, info) => {   
            if (error) {
                console.error("Error sending OTP: ", error);
                req.flash("error", "Failed to send OTP. Please try again.") 
                return res.redirect("/forget_password_email");
            }
            });
    }
     
   

module.exports ={
     generateOTP,
     sendingMail,
     transporter
}