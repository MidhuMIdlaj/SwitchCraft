const User = require('../../models/userscheema')
const bcrypt = require("bcrypt");


 const  
 
 resetPassword = async(req,res)=>{
    try {
        let user = null;
        if(req.session.userData){
            user = await User.findOne({ _id: req.session.userData._id, isBlocked: false });
            res.render('user/resetPassword',
                {user}
            )
        }
        else{
             res.redirect('/login')
        }
    } catch (error) {
        console.log('error from reset password', error )
    }
 }



    const postReset = async(req,res)=>{
        try {
            const {password} = req.body
              const userName =  req.session.userData.name
              const userPassword = await User.findOne({name: userName}, {_id : 0,  password : 1})
              const isMatch = await bcrypt.compare(password, userPassword.password);
              if(isMatch){
                  res.redirect('/confirmPassword')
              }else{
                req.flash("error", "incorrect password...")
                return res.redirect("/resetPassword")
              }
        } catch (error) {
            console.log('error reset password',error)
        }
    }




    const changePassword = async(req,res)=>{
        try {
            let user = null
            if(req.session.userData){
                user = await User.findOne({ _id: req.session.userData._id, isBlocked: false });
                res.render('user/confirmPassword',
                    {user}
                )
            }
        } catch (error) {
            console.log('confirm error ', error)
        }
    }

    
     const postConfirmPassword = async(req,res)=>{
        const passwordPattern =  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        const{newPassword, confirmPassword} = req.body
        const userId = req.session.userData._id    
        if (!passwordPattern.test(newPassword)) {
            req.flash(
              "error",
              "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one digit, and one special character (such as @, $, !, %, *, ?, or &)."
            );
            return res.redirect("/confirmPassword");
          }

           if (newPassword !== confirmPassword) {  
            req.flash("error", "incorrect password");
            return res.redirect("/confirmPassword");
           }

           const hashedPassword = await bcrypt.hash(newPassword, 10);
            const update =await User.updateOne({_id : userId}, {$set:{
                password : hashedPassword
            }})

            req.flash("success", "Password updated successfully!");
            res.redirect("/profile");           
        }
        

 module.exports ={
    resetPassword,
    postReset,
    changePassword,
    postConfirmPassword
 }