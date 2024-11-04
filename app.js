const express = require('express');
const app = express();
require('dotenv').config();
const path = require('path');
const DB = require('./config/db');
const session = require('express-session')
const passport =  require('./config/passport')
const ejs = require('ejs')
const userRouter = require('./routers/userRouter')
const adminRouter = require('./routers/adminRouter')
const flash  = require('connect-flash');
const morgan = require('morgan');
const nocache = require('nocache');
const Razorpay = require('razorpay');
 DB()

app.use(session({
  secret: 'your-secret-key', // Replace with your own secret key
  resave: false,
  saveUninitialized: true,
}));


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.use(morgan('dev'))
app.use(express.json());
app.use(express.urlencoded({extended: true})); 
app.use(flash())
app.use(nocache())
app.use((req, res, next) => {
  res.locals.messages = req.flash()
  next()
})
app.use(passport.initialize())
app.use(passport.session());
app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))
app.use(express.static(path.join(__dirname,'public')))

app.use('/',userRouter)
app.use('/admin',adminRouter)


app.listen(process.env.PORT,() => {
  console.log('Server is running');
});


module.exports = app