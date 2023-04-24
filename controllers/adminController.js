const User = require("../models/userModel");
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const excelJs = require("exceljs");

//html to pdf require things
const ejs = require('ejs');
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');

const securedPasswod = async (password) => {
    try {
        const passwordhas = await bcrypt.hash(password, 10);
        return passwordhas;
    } catch (error) {
        console.log(error.message);
    }
}

const loadLogin = async (req, res) => {
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
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_admin == 0) {
                    res.render('login', { message: 'Email && Paasword are not exists!' });
                } else {
                    req.session.user_id = userData._id;
                    res.redirect('/admin/home');
                }
            } else {
                res.render('login', { message: 'Email && Paasword are not exists!' });
            }

        } else {
            res.render('login', { message: 'Email && Paasword are not exists!' });
        }

    } catch (error) {
        console.log(error.message);
    }
}


const homeDashboard = async (req, res) => {
    try {
        const loginUserData = await User.findById({ _id: req.session.user_id });
        res.render('home', { loginUserData: loginUserData });
    } catch (error) {
        console.log(error.message);
    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin');
    } catch (error) {
        console.log(error.message);
    }
}

const adminDashboard = async (req, res) => {
    try {
        var search = '';
        if(req.query.search){
          search = req.query.search;
        }
        var page = 1;
        if(req.query.page){
          page = req.query.page;
        }
        const limit = 2;
        const userData = await User.find(
            { is_admin: 0,
                $or:[
                    { name:{$regex:'.*'+search+'.*',$options:'i'} },
                    { email:{$regex:'.*'+search+'.*',$options:'i'} },
                    { mobile:{$regex:'.*'+search+'.*',$options:'i'} }
                ]
            }
            )
            .limit(limit * 1)
            .skip((page - 1)* limit)
            .exec();
            const counts = await User.find(
                { is_admin: 0,
                    $or:[
                        { name:{$regex:'.*'+search+'.*',$options:'i'} },
                        { email:{$regex:'.*'+search+'.*',$options:'i'} },
                        { mobile:{$regex:'.*'+search+'.*',$options:'i'} }
                    ]
                }
                ).countDocuments();


        res.render('dashboard', 
        {
            userData: userData,
            totalPages:Math.ceil(counts/limit),
            currentpage:page
        });
    } catch (error) {
        console.log(error.message);
    }
}

const newUserLoad = async (req, res) => {
    try {
        res.render('new_user');
    } catch (error) {
        console.log(error.message);
    }
}

const addUser = async(req, res) => {
    try {
        console.log(req.body);
        const name = req.body.name;
        const email = req.body.email;
        const mobile = req.body.mobile;
        const image= req.file.filename;
        const password = req.body.password;
        const spassword = await securedPasswod(password);
        const user = new User({
            name:name,
            email:email,
            mobile:mobile,
            image:image,
            password:spassword,
            is_admin:0,
            is_verified:1
        });
        const userData = await user.save();
        if(userData){
            res.redirect('/admin/dashboard');
            console.log('User saved!');
        }else{
            res.render('new_user',{message:'Something went wrong!'});
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

const exportUsers = async(req, res)=>{
    try {
        const workbook = new excelJs.Workbook();
        const worksheet = workbook.addWorksheet("My users");
        worksheet.columns = [
           {header:"S.no",key:"s_No"},
           {header:"Name",key:"name"},
           {header:"Email Id",key:"email"},
           {header:"Mobile",key:"mobile"},
           {header:"Is Admin",key:"is_admin"},
           {header:"Is Varified",key:"is_verified"},
        ];
        let counter = 1;
        const userData =  await User.find({is_admin:0}); 
        userData.forEach((user)=>{
            user.s_No = counter;
            worksheet.addRow(user);
            counter++;
        });
        worksheet.getRow(1).eachCell((cell)=>{
            cell.font = {bold:true};
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
        res.setHeader("Content-Disposition", "attachment; filename=users.xlsx"); 
        return workbook.xlsx.write(res).then(()=>{
          res.status(200);
        });


    } catch (error) {
        console.log(error.message);
    }
}

const exportUsersPdf = async(req, res)=>{
       try {
        const userData =  await User.find({is_admin:0}); 
        const data = {
            userData:userData
        }
        const filePathName = path.resolve(__dirname,'../views/admin/htmltopdf.ejs');
        const htmlString = fs.readFileSync(filePathName).toString();
        let options = { format: 'Letter' };
        const ejsData = ejs.render(htmlString,data);

        pdf.create(ejsData, options).toFile('users.pdf', (err, response)=> {
            if (err) return console.log(err);
            const filePath = path.resolve(__dirname,'../users.pdf'); 

            fs.readFile(filePath,(error,file)=>{
                /*if(error){
                   res.json({'status':'error',msg:err});
                } */
                res.setHeader('Content-Type', 'application/pdf');    
                res.setHeader('Content-Disposition', 'attachment;filename="users.pdf"');
                res.send(file);  
                
            });

          });
       } catch (error) {
          console.log(error);
       }
}

module.exports = {
    loadLogin,
    verifyLogin,
    homeDashboard,
    logout,
    adminDashboard,
    newUserLoad,
    addUser,
    exportUsers,
    exportUsersPdf
}