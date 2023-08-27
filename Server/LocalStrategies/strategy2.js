const Admin = require("../Models/adminSchema");
const LocalStrategy = require("passport-local");
const bcrypt = require('bcrypt');
const saltRounds = 10;

//defining local strategy - 2, for admin
const strategy2 = new LocalStrategy(async (username, password, done)=>{
    // console.log(username, password);
    try{
        const user=await Admin.findOne({email: username});
        // console.log(user);
        if(!user) return done(null, false);

        bcrypt.compare(password, user.password, function(err, result) {
            // result == true
            if(err){
                // console.log(err);
            }
            if(result){
                return done(null, user);
            }
            else{
                return done(null, false);
            }
        });
    }
    catch(err){
        return done(err, false);
    }
});

module.exports = strategy2;