const User = require('../../models/userscheema')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')    




const loadLogin = async(req,res)=>{
    try {
        if(req.session.admin){
            return res.redirect('/admin/dashboard')
        }else{
            res.render('admin/login', {message : null})
        }
    } catch (error) {
        console.log('not found login page', error)
    }
}


      const postLogin = async(req,res)=>{
       const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
       const passwordPattern =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      try {
        const{email,password} = req.body

        if (!email || !password) {
            req.flash("error", "All fields are required.");
            return res.redirect("/admin/login");
          }

           // email //
        if (!emailPattern.test(email)) {
        req.flash("error", "Email not verified");
        return res.redirect("/admin/login");
         }

           // password //
         if (!passwordPattern.test(password)) {
        req.flash("error", "Password is  not strong");
        return res.redirect("/admin/login");
         }

        const admin = await User.findOne({email,isAdmin: true})
        if(admin){
            const passwordMatch =await bcrypt.compare(password,admin.password )
            if(passwordMatch){
                req.session.admin = true 
                return res.redirect('/admin/dashboard')    
            }else{
                req.flash("error", "incorrect your password");
                return res.redirect('/admin/login')
            }
             }else{
                 return res.redirect('/admin/login')
           }
         } catch (error) {
             console.log('login error', error)
         }
           }
     


          const  logout = async(req,res) =>{
               try {
                req.session.admin = null
                    res.redirect('/admin/login')
               } catch (error) {
                console.log('unexpected error during logout', error)
               }
          }
           



module.exports = {
    loadLogin,
    postLogin,
    logout
}
