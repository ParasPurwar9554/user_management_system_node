

const isLogin = async (req, res, next) => {
    try {
        if (req.session.email) {} 
        else {
            res.redirect('/login');
        }
        next();
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async (req,res,next) => {
    try {
        console.log(req.session.email);
        if (req.session.email) {
            res.redirect('/home');
        }
        next();
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    isLogin,
    isLogout,
}