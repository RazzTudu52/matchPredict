const bodyParser= require("body-parser");
const User = require("../Models/userSchema");
const { default: mongoose } = require("mongoose");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const transporter = require('../emailTranport.js');
//register new user post request callback function

const register = async (req, res)=>{
    let { name, email, password, password_confirmation, tc } = req.body;
    email = email.trim(); 

    const userexist = await User.findOne({ email: email });
    if(userexist){  
    const viewData = { status: "failed", message: "Email already exists" }
       // console.warn(viewData);
    }else{
        name = name.trim();
        if(name && email && password && password_confirmation && tc && (tc== true || tc == "on")){
            tc=(tc == "on")? true:false;
            if(password === password_confirmation){
                try{
                    const salt = await bcrypt.genSalt(10);
                                 const hashPassword = await bcrypt.hash(password, salt);
                
                                 const tempUser = new User({
                                   name: name,
                                   email: email,
                                   password: hashPassword,
                                   tc: tc
                                  });
                 
                                const saveTemp =  await tempUser.save();
                                const token = jwt.sign({ userID:  saveTemp._id }, process.env.JWT_SECRET_KEY, { expiresIn: '300s' });
                                const link = `http://127.0.0.1:5000/conform-account/${saveTemp._id}/${token}`;  
                                const mail_configs = {
                                from: process.env.EMAIL_USER,
                                to: saveTemp.email,
                                subject: "testing koding 101 Email",
                                text: "just Checking if this email  wil be sent or not",
                                html: `<a href=${link}>Click Here</a> to conform yore Email for registration this link only valiid for 5 Minuts`
                                }  

                                transporter.sendMail(mail_configs); 
                                res.redirect("/");
                }catch(error){
                    // // console.warn(error);
                    const viewData = { status: "failed", message: "Unable to Register" }
                    res.render('register.ejs', viewData);
                }
            }else{
            const viewData = { status: "failed", message: "All Passwords dose not Match" }
                res.render('register.ejs', viewData);
            }
        }else{
            
        const viewData = { status: "failed", message: "All fields are required" }
        res.render('register.ejs', viewData);
        }
    }
}


module.exports = register;