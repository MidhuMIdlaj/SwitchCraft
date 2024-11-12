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

 const toggleCustomerStatus = async (req, res) => {
    const { userId } = req.params;
    const { isBlocked } = req.body;

    try {
        await User.updateOne({ _id: userId }, { $set: { isBlocked: isBlocked } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating block status:', error);
        res.json({ success: false });
    }
};


 module.exports ={
    customerLoad,
    toggleCustomerStatus
   
 }