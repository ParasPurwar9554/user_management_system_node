const express = require("express");
const admin_route = express();
const multer = require('multer');
const path = require("path");
const session = require("express-session");
const config = require("../config/config");
admin_route.use(session({secret:config.sessionSecret}));
const bodyParser = require("body-parser");
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));
admin_route.use(express.static('public'));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../public/userImages'))
    },
    filename: function (req, file, cb) {
      const name = Date.now() + '-' + file.originalname;
      cb(null, name)
    }
  })
  
const upload = multer({ storage: storage });

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

const auth = require('../middleware/adminauth');

const adminController = require("../controllers/adminController");

admin_route.get('/',auth.isLogout,adminController.loadLogin);

admin_route.post('/',adminController.verifyLogin);
admin_route.get('/home',auth.isLogin,adminController.homeDashboard);
admin_route.get('/logout',auth.isLogin,adminController.logout);
admin_route.get('/dashboard',adminController.adminDashboard);
admin_route.get('/new-user',auth.isLogin,adminController.newUserLoad);
admin_route.post('/new-user',upload.single('image'),adminController.addUser);
admin_route.get('/export-users',auth.isLogin, adminController.exportUsers);
admin_route.get('/export-users-pdf',auth.isLogin, adminController.exportUsersPdf);

admin_route.get('*',(req,res)=>{
    res.redirect('/admin');
 });

module.exports = admin_route;