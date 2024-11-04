const User = require("../../models/userscheema");
const bcrypt = require("bcrypt");
const router = require("../../routers/userRouter");
const nodemailer = require("nodemailer");
const { generateOTP, sendingMail } = require("../../helpers/otpVerification");

/* login page */

const loadLogin = async (req, res) => {
  try {
   if(!req.session.userData){
     return res.render("user/login")
   }else{
    res.redirect('/')
   }
  } catch (error) {
    console.log("login page  not loading", error);
    res.status(500).send("server error");
  }
};



// login validation tole //
const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

//loginPage validation//
const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      req.flash("error", "All fields are required.");
      return res.redirect("/login");
    }

    if (!emailPattern.test(email)) {
      req.flash("error", "Invalid email format.");
      return res.redirect("/login");
    }

    if (!passwordPattern.test(password)) {
      req.flash("error", "Password is not strong enough.");
      return res.redirect("/login");
    }

    let user = await User.findOne({ email });

    if (!user) {
      req.flash("error", "Email or password is incorrect.");
      return res.redirect("/login");
    }

    if (user.isBlocked) {
      req.flash("error", "User is currently blocked.");
      return res.redirect("/login");
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      req.flash("error", "Email or password is incorrect.");
      return res.redirect("/login");
    }

    req.session.userData = user;


    return res.redirect("/");

  } catch (error) {
    console.error("Error during login:", error);
    req.flash("error", "Something went wrong. Please try again.");
    return res.redirect("/login");
  }
};


/* signup page */

const loadSignup = async (req, res) => {
  try {
      res.render("user/signup");
  } catch (error) {
    console.log("signup page  not loading", error);
    res.status(500).send("server error");
  }
}

const postSignup = async (req, res) => {
  const namePattern = /^[a-zA-Z\s-]{2,50}$/;
  const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  // validation check
  try {
    const { name, email, password, confirmPassword } = req.body;
     req.session.userData = { name, email, password, confirmPassword }
    if (!name || !email || !password || !confirmPassword) {
      req.flash("error", "All fields are required.");
      return res.redirect("/signup");
    }

    if (!namePattern.test(name)) {
      req.flash(
        "error",
        "Name must be 2-50 characters long and can only contain letters, spaces, and hyphens."
      );

      return res.redirect("/signup");
    }

    if (!emailPattern.test(email)) {
      req.flash("error", "Email not verified");
      return res.redirect("/signup");
    }

    if (!passwordPattern.test(password)) {
      req.flash(
        "error",
        "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one digit, and one special character (such as @, $, !, %, *, ?, or &)."
      );
      return res.redirect("/signup");
    }

    if (password !== confirmPassword) {  
        req.flash("error", "incorrect password");
        return res.redirect("/signup");
    } 
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "User already exists with this email.");
      return res.redirect("/signup");
    }

    const otp = generateOTP();
    const expiry = Date.now() + 5 * 60000; 
    req.session.otp = { otp: otp, expiry: expiry };
    // Send OTP to user's email
    await sendingMail(email, otp);
    req.flash("success", "OTP sent successfully. Please check your email.");
    return res.redirect("/otpsignup");
    } catch (error) {
    if (error.code == 11000) {
      req.flash("error", "User already exists with this email.");
      return res.redirect("/signup");
    }
    }
    };


    // otp for signup//

    const loadOtpSignup = async (req, res) => {
        try {
          res.render("user/otpsignup");
        } catch (error) {
          console.error("Error loading OTP signup page:", error);
          res.status(500).send("Server error");
        }
      };
      

      const verifyOTPsignup = async (req, res) => {
        try {
          const { otp } = req.body;

          // Check if OTP session data exists
          const storedData = req.session.otp;
          if (!storedData) {
            return res.json({
              success: false,
              message: "OTP not found or expired. Please request a new OTP.",
            });
          }
      
          if (!req.session.userData) {
            return res.json({
              success: false,
              message: "User session data not found. Please restart the signup process.",
            });
          }
      
          const { name, email, password } = req.session.userData;
          const { otp: storedOtp, expiry } = storedData;
      
          if (storedOtp == otp && Date.now() < expiry) {
      
            try {
              const hashedPassword = await bcrypt.hash(password, 10);
              const user = await User.create({ name, email, password: hashedPassword });
              
              req.session.userData = user;
      
              return res.json({ success: true, redirectUrl: "/" });
            } catch (error) {
              console.error("Error during user creation:", error);
              return res.json({
                success: false,
                message: "An error occurred while creating the user. Please try again.",
              });
            }
          } else {
            return res.json({
              success: false,
              message: "Invalid or expired OTP. Please try again.",
            });
          }
        } catch (error) {
          console.error("Error during OTP verification for signup:", error);
          return res.json({
            success: false,
            message: "An error occurred. Please try again.",
          });
        }
      };
      
      
      // resend otp handle 
      const resendOtpSignup = async (req, res) => {
        if (!req.session.userData) {
          return res.json({
            success: false,
            message: "User session data not found. Please restart the signup process.",
          });
        }
        const { name, email, password } = req.session.userData; 
        const otp = generateOTP(); 
        const expiryTime = Date.now() + 5 * 60000;
      
       
        req.session.otp = { otp: otp, expiry: expiryTime };
      try {
          // Send OTP to the user's email
          await sendingMail(email, otp);
          return res.json({
            success: true,
            message: "OTP resent successfully."
          });
        } catch (error) {
          console.error("Error during OTP resend:", error);
          return res.json({
            success: false,
            message: "Failed to resend OTP. Please try again.",
          });
        }
      };
      
      

/* forget password page */

const loadForgotPageLogin = async (req, res) => {
  res.render("user/forget_password_email");
};

//forget Password validation//
const PostForgetPasswordLogin = async (req, res) => {
  const { email } = req.body;
  req.session.email = email;
  try {
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!email) {
      req.flash("error", "All fields are required.");
      return res.redirect("/forget_password_email");
    }

    if (!emailPattern.test(email)) {
      req.flash("error", "Email not verified");
      return res.redirect("/forget_password_email");
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      req.flash("error", "this mail not registered");
      return res.redirect("/forget_password_email");
    }
    // Generate OTP
    const otp = generateOTP();
    const expiry = Date.now() + 60000; 
    req.session.otp = { otp: otp, expiry: expiry };
    await sendingMail(email, otp);
    req.flash("success", "OTP sent successfully. Please check your email.");
    return res.redirect("/otp");
  } catch (error) {
    console.log(error);
    req.flash("error", "An error occurred. Please try again.");
    res.redirect("/forget_password_email");
  }
};


/* otp page controller */
const loadOtpLOginPage = async (req, res) => {
  res.render("user/otp");
};


const verifyOtpLogin = async (req, res) => {
  const { otp } = req.body;

  const storedData = req.session.otp;

  if (!storedData) {
    return res.json({
      success: false,
      message: "OTP not found or expired. Please request a new OTP.",
    });
  }

  const { otp: storedOtp, expiry } = storedData;

  if (storedOtp == otp && Date.now() < expiry) {
    return res.json({ success: true, redirectUrl: "/changepassword" });
  } else {
    return res.json({
      success: false,
      message: "Invalid or expired OTP. Please try again.",
    });
  }
};




const resendOtpLogin = async (req, res) => {
  const otp = generateOTP();
  const email = req.session.email;
  const expiryTime = Date.now() + 60 * 1000;
  req.session.otp = { otp: otp, expiry: expiryTime };
  await sendingMail(email, otp);
  res.json({ success: true, message: "OTP resent successfully." });
};



/* change password */
const loadChangePasswordLogin = async (req, res) => {
  res.render("user/changepassword");
};
const postChangePasswordLogin = async (req, res) => {
  const email = req.session.email;

  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  try {
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) {
      req.flash("error", "All fields are required.");
      return res.redirect("/changepassword");
    }
    if (!passwordPattern.test(password)) {
      req.flash(
        "error",
        "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one digit, and one special character (such as @, $, !, %, *, ?, or &)."
      );
      return res.redirect("/changepassword");
    }

    if (password == confirmPassword) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.updateOne(
        { email: email },
        { $set: { password: hashedPassword } }
      );
      res.redirect("/passwordSuccess");
    } else {
      req.flash("error", "incorrect password");
      return res.redirect("/changepassword");
    }
  } catch (error) {
    console.log(error);
  }
};

/* success page  */

const loadSuccess = async (req, res) => {
  res.render("user/passwordSuccess");
};

 
const logout = async(req,res) =>{

   try {
    req.session.userData = null
      return res.redirect('/login')
    
   } catch (error) {
    console.log('logout error', error)
    res.redirect('/pageNotFound')
   }
}

module.exports = {
  loadLogin,
  postLogin,
  loadSignup,
  postSignup,
  loadForgotPageLogin,
  PostForgetPasswordLogin,
  loadOtpLOginPage,
  verifyOtpLogin,
  loadChangePasswordLogin,
  postChangePasswordLogin,
  loadSuccess,
  resendOtpLogin,
  loadOtpSignup,
  verifyOTPsignup,
  resendOtpSignup,
  logout
};
