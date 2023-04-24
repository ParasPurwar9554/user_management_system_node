const User = require("../models/userModel");
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const { findOne } = require("../models/userModel");

const securedPasswod = async (password) => {
    try {
        const passwordhas = await bcrypt.hash(password, 10);
        return passwordhas;
    } catch (error) {
        console.log(error.message);
    }
}

const sendVerifyMail = async (name, email, user_id) => {
    try {
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: '',
                pass: ''
            }
        });
        const mailOptions = {
            from: '',
            to: '',
            subject: 'For verification mail by node js',
            html: '<p>Hello Paras,Please click here to <a href="http://localhost:7000/verify?id=' + user_id + '"> Verify</a></p>'
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Send" + info.response);
            }
        });
    } catch (error) {
        console.log(error.message);
    }
}

const loadRegister = async (req, res) => {
    try {
        res.render('registration');
    } catch (error) {
        console.log(error.message);
    }
}

const insertUser = async (req, res) => {
    console.log(req.body);
    try {
        const spass = await securedPasswod(req.body.password);
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            image: req.file.filename,
            password: spass,
            is_admin: 0
        });
        const userData = await user.save();
        if (userData) {
            sendVerifyMail(req.body.name, req.body.email, userData._id);
            res.render('registration', { message: 'Registration has been successfully!. Please verify your email.' });
        } else {
            res.render('registration', { message: 'Registration Failed!' });
        }
    } catch (error) {
        console.log(error);
    }
}

const verify = async (req, res) => {
    try {
        const updateInfo = await User.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } });
        res.render('email-verified');
    } catch (error) {
        console.log(error.message);
    }
}

//Login method start here

const loginLoad = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}
const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email });
         console.log(userData);
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_verified === 0) {
                    res.render('login', { message: 'Please verify your email!' });
                } else {
                    req.session.email = userData.email;
                    req.session.user_id = userData._id;
                    res.redirect('/home');
                }
            }
            else {
                res.render('login', { message: 'Email and Password incorrect!' });
            }
        } else {
            res.render('login', { message: 'Email and Password incorrect!' });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const homeLoad = async (req, res) => {
    try {
        const userData = await User.findById({ _id:req.session.user_id });
        console.log(userData);
        res.render('home',{user:userData});
    } catch (error) {
        console.log(error.message);
    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/login');
    } catch (error) {
        console.log(error.message);
    }
}

const forgetLoad = async (req, res) => {
    try {
        res.render('forget');
    } catch (error) {
        console.log(error.message);
    }
}
// Forget password mail 

const sendResetPasswordMail = async (name, email, token) => {
    try {
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: '',
                pass: ''
            }
        });
        const mailOptions = {
            from: '',
            to: '',
            subject: 'For  Reset Passwrd mail by node js',
            html: '<p>Hello Paras,Please click here to <a href="http://localhost:7000/forget-password?token=' + token + '"> Verify</a></p>'
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Send" + info.response);
            }
        });
    } catch (error) {
        console.log(error.message);
    }
}

const forgetVerify = async (req, res) => {
    try {
        const email = req.body.email;
        const userEmailData = await User.findOne({ email: email });
        if (userEmailData) {
            const randomstringdata = randomstring.generate();
        // const  randomstring = 'paras';
            if (userEmailData.is_verified === 0) {
                res.render('forget', { message: 'Please verify your email.' });
            } else {
                
 const updatedData = await User.updateOne({ email: email }, { $set: { token: randomstringdata } });
                sendResetPasswordMail(userEmailData.name,email,randomstringdata);
                res.render('forget', { message: 'Check your mail to reset password.' });
            }

        } else {
            res.render('forget', { message: 'Email is incorrect!' });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const forgetPasswordLoad = async(req, res)=>{
      try {
          const token = req.query.token;
          const tokenData = await User.findOne({token:token});
          console.log(token);
          res.render("forget-password",{user_id:tokenData.id});
        }
       catch (error) {
        console.log(error.message);
      }
}

const resetPassword = async(req,res)=>{
     try {
        const password = req.body.password;
        const user_id = req.body.user_id;
        const secure_password = await securedPasswod(password);
        const updatedData = await User.findByIdAndUpdate({_id:user_id},{ $set:{password:secure_password,token:''} });
        res.redirect('/login');

     } catch (error) {
        console.log(error.message);
     }
}

const verificationLoad = async(req,res)=>{
    try {
        res.render('verification');
    } catch (error) {
        console.log(error.message);
    }
}

const sentVerificationLink = async(req,res)=>{
        const email = req.body.email;
        const userData = await User.findOne({email:email});
        if(userData){
           sendVerifyMail(userData.name,userData.email,userData._id);
           res.render('verification',{message:"Reset verification mail sent your email id."});
        }else{
           res.render('verification',{message:"This email is not exists."}); 
        }
}
//user profile edit
const editLoad = async(req,res)=>{
     try {
        const id = req.query.id;
        const userData = await User.findById({ _id:id });
        if(userData){ 
          res.render('edit',{user:userData});
        }else{
          res.redirect('/home');
        }
     } catch (error) {
        console.log(error.message);
     }
}

const updateProfile = async(req,res)=>{
      try {
         if(req.file){
            const userData = await  User.findByIdAndUpdate({_id: req.body.user_id},{$set:{
                name:req.body.name,
                email:req.body.email,
                mobile:req.body.mno,
                image:req.file.filename
            }
            });
         }else{
         const userData = await  User.findByIdAndUpdate({_id: req.body.user_id},{$set:{
            name:req.body.name,
            email:req.body.email,
            mobile:req.body.mno
        }
        });
        }
        res.redirect('/home');
      } catch (error) {
        console.log(error.message);
      }
}

module.exports = {
    loadRegister,
    insertUser,
    verify,
    loginLoad,
    verifyLogin,
    homeLoad,
    logout,
    forgetLoad,
    forgetVerify,
    forgetPasswordLoad,
    resetPassword,
    verificationLoad,
    sentVerificationLink,
    editLoad,
    updateProfile
}