const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
mongoose.connect('mongodb://127.0.0.1:27017/UMS')
    .then(() => console.log('Connected!'));
const express = require("express");
const app = express();
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");

app.use('/',userRoute);

app.use('/admin',adminRoute);


app.listen(7000,function(){
    console.log("Server is runing on 7000");
})