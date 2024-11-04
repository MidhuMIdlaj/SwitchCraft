const User = require("../../models/userscheema")

const retryPayment = async(req,res)=>{
    try {
        if(req.session.userData){ 
            const userId =req.session.userData._id
            const user = await User.findOne({ _id: userId, isBlocked: false });
            res.render('user/payment-failure',
                {user}
            )
        }
    } catch (error) {
        console.log(" error from retry payment :", error)
    }
   }

   module.exports={
    retryPayment
   }