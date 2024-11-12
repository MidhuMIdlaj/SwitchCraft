
const Coupon = require('../../models/couponSchema')


    const loadCoupon = async(req,res)=>{
        try {
            if(req.session.admin){
                const today = new Date();
                let coupon = await Coupon.find()
                coupon.forEach(async (coupon) => {
                    if (new Date(coupon.expireOn) < today && coupon.isList){
                        coupon.isList = false;
                        await coupon.save();
                    }
                });         
                res.render('admin/coupon',
                    {coupon :coupon }
                )
            }else {
                res.redirect('/admin/login')
            }
        } catch (error) {
            console.log('error from coupon page ', error)
        }
    }



const addCoupon = async (req, res) => {
    try {
        const { OfferPrice, minimumPrice,  expireOn } = req.body;
        let errors = {};
        const generateCode = () => {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            let result = '';
            for (let i = 0; i < 8; i++) {
                const randomIndex = Math.floor(Math.random() * characters.length);
                result += characters.charAt(randomIndex);
            }
            return result;
        }

        const name  =  generateCode()
        if (OfferPrice < 1 || OfferPrice > 100) {
            errors.OfferPrice = "Offer must be between 1% and 100%.";
        }   
        const today = new Date();
        const expireDate = new Date(expireOn);
        if (expireDate <= today) {
            errors.expireOn = "Expire date should be a future date.";
        }
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        const newCoupon = new Coupon({
            name,
            OfferPrice,
            minimumPrice,
            expireOn: expireDate
        });
        await newCoupon.save();
        return res.json({ success: true })

    } catch (error) {
        console.error('Error from addCoupon:', error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        await Coupon.findByIdAndDelete(couponId);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ success: false, error: 'An error occurred while deleting the coupon.' });
    }
};




module.exports ={
    loadCoupon,
    addCoupon,
    deleteCoupon
}