const User = require("../../models/userscheema");
const bcrypt = require("bcrypt");
const router = require("../../routers/userRouter");
// const nodemailer = require("nodemailer");

// error Handle //
const pageNotFound = async (req, res) => {
  try {
    res.render("user/page-404");
  } catch (error) {
    res.redirect("/pageNotFound");
  }
}

//home page router //
const loadHomepage = async (req, res) => {
  try {
    let user;

    // Check if there's a normal user in session
    if (req.session.userData) {
      user = await User.findOne({ _id: req.session.userData._id, isBlocked: false });
      if (user) {
        
        return res.render('user/home', { user });
      }
    }

    if (req.session.passport && req.session.passport.user) {
      const googleUserId = req.session.passport.user;
      user = await User.findOne({ _id: googleUserId, isBlocked: false });
      if (user) {
        return res.render('user/home', { user });
      }
    }
    return res.render('user/home', { user: null });
  
  } catch (error) {
    console.error('Error loading homepage:', error);
    res.status(500).send('Server error');
  }
};


module.exports = {
  loadHomepage,
  pageNotFound,
};
