const { query } = require('express')
const User = require('../../models/userscheema')



 const customerLoad = async(req,res)=>{
    try {
        if(req.session.admin){
        const userData  =await User.find({
            isAdmin: false})
        res.render("admin/customer",{
            userData,         
        })
    }else{
         res.redirect('/admin/login')
    }
    } catch (error) {
        
    }
 }



 const customerBlock = async(req,res)=>{
      try {
        let id = req.query.id
        await User.updateOne({_id:id}, {$set:{isBlocked : true}})
        if(req.session.userData){
            delete req.session.userData
        }
        res.redirect('/admin/users?blocked=true');
      } catch (error) {
        console.log("error customerBlock", error)
        res.redirect('/admin/users?blocked=false');  
      }
 }

 const  customerUnBlock= async(req,res)=>{
        try {
            let id  = req.query.id
            await User.updateOne({_id: id}, {$set:{isBlocked: false}})
            res.redirect("/admin/users")
        } catch (error) {
            console.log("customerUnBlock error", error)
        }
 }
     

 module.exports ={
    customerLoad,
    customerBlock,
    customerUnBlock
 }