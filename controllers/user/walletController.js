const User = require("../../models/userscheema")

const loadWallet = async (req, res) => {
    try {
        if (req.session.userData) {
            const userId = req.session.userData._id;
            const user = await User.findOne({ _id: userId, isBlocked: false });

            const page = parseInt(req.query.page) || 1;
            const limit = 6; 
            const skip = (page - 1) * limit;


            const totalTransactions = user.transaction.length;
            const totalPages = Math.ceil(totalTransactions / limit);

            const transactions = user.transaction.slice(skip, skip + limit);

            res.render('user/wallet', {
                user,
                transactions,
                currentPage: page,
                totalPages,
            });
        } else {
            res.redirect("/login");
        }
    } catch (error) {
        console.log("Error from wallet: ", error);
        res.status(500).send("Server Error");
    }
};



module.exports ={
    loadWallet,
}