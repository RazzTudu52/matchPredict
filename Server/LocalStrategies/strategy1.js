const User = require("../Models/userSchema");
const LocalStrategy = require("passport-local");
const bcrypt = require('bcrypt');
const saltRounds = 10;

//defining local strategy - 1
const strategy1 = new LocalStrategy(async (username, password, done)=>{
    // console.log(username, password);
    
    try{
        const user=await User.findOne({email: username});
        // console.log(user);
        if(!user) return done(null, false);

        //bcrypt.compare passwords
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

module.exports = strategy1;