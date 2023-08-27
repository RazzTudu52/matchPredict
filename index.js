//requiring packages
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const alert = require('alert');
const fs = require('fs');
const User = require('./Server/Models/userSchema');
const Input = require('./Server/Models/userInput.js')
const Admin = require('./Server/Models/adminSchema');
const Team = require('./Server/Models/teams.js');
const Result = require('./Server/Models/result.js')
const strategy1 = require("./Server/LocalStrategies/strategy1");
const strategy2 = require("./Server/LocalStrategies/strategy2");
const connectDB = require("./Server/connection.js");
const bcrypt = require('bcrypt');
const saltRounds = 10;

const jwt = require('jsonwebtoken');

const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const register = require('./Server/Controllers/register');
const { count } = require('console');

const PORT = process.env.PORT;

const app = express();

// app.use(routerReg);

//setting path of public folder, and view engine to ejs
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

//setting up session for express
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

//initialize passport
app.use(passport.initialize());
app.use(passport.session());

//connect to database
connectDB();//.catch(err => // console.log(err));  

//defining passport strategies
passport.use("local1", strategy1);
passport.use("local2", strategy2);

//setting up serialize and deserialize functions
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
    try {
        const user = await User.findById(id) || await Admin.findById(id);
        done(null, user);
    }
    catch (err) {
        done(err, false);
    }
});


// User Side Code
app.get('/', (req, res) => {

    res.status(201).render('home.ejs');
})


app.get("/login", function (req, res) {
    res.render('login');
});


app.get("/register", function (req, res) {
    res.render('register');
});


// post function for register route
app.post("/register", register);


//post for login route, passport authentication is done using local strategy1
app.post("/login", passport.authenticate('local1', { failureRedirect: '/login' }), async (req, res) => {
    res.redirect("/userHome");
});


//logout user, destroy cookies
app.get("/logout", (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

/// conform email
app.get('/conform-account/:id/:token', async (req, res, next) => {
    const { id, token } = req.params;

    if (id && token) {
        const saved_user = await User.findById(id);
        const varifyToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (saved_user && varifyToken) {
            await User.findByIdAndUpdate(saved_user._id, { $set: { verified: true } })
            await User.findByIdAndUpdate(saved_user._id, { $unset: { expireAt: "date.now()" } })
            res.redirect('/login')
            next();

        } else {
            // console.warn("Not vallid links or expired links");
        }
    } else {
        const viewData = { status: "failed", massage: "not valid links" }
    }
})


let day = Date.now();

app.post("/satDay", isAuth, async (req, res) => {
    if (req.isAuthenticated()) {
       let dayReq = req.body;
       day = dayReq.resultDay;
        res.redirect("/adminHome");
    }
    else {
        res.redirect("/adminLogin");
    }
});






//get for userHome, opened only when user is verified
app.get("/userHome", async (req, res) => {

    if (req.isAuthenticated()) {
        const dataTeam = await Team.find({});
       const AllTeam = dataTeam.filter(Team => Team.matchNo !== null);
        let firstTeam = [];
        let secondTeam = [];
        const midpoint = Math.ceil(AllTeam.length / 2);
        for (let i = 1; i <= midpoint; i++) {
            let filteredData = AllTeam.filter(item => item.matchNo === i);
            firstTeam.push(filteredData[0]);
            secondTeam.push(filteredData[1]);
        }


        res.status(201).render('userHome.ejs', { team1: firstTeam, team2: secondTeam, day : day});
    }
    else {
        res.redirect("/login");
    }
});



//Post user 
app.post("/userInput", async (req, res) => {

    if (req.isAuthenticated()) {
        const email = req.user.email;

        let userTeamInput = req.body;
        userTeamInput.email = email;
        const teamwillwinsave = new Input(userTeamInput);
        const saveTemp = await teamwillwinsave.save();
        // // console.warn(userTeamInput);
        res.redirect("/userHome");
    }
    else {
        res.redirect("/login");
    }
});

// for Privious Result 
app.get("/perivious/result", async (req, res) => {

    if (req.isAuthenticated()) {  
    let result = await Result.find({});
    // // console.warn(result);
    res.render('result.ejs');
    }
    else {
        res.redirect("/login");
    }
});





// Admin Side Code
// get for adminLogin route
app.get('/adminLogin', (req, res) => {
    res.render('adminLogin');
});

//post for admin login route, authentication done using local strategy 2
app.post("/adminLogin", passport.authenticate('local2', { failureRedirect: '/adminLogin' }), async (req, res) => {
    res.redirect("/adminHome");
});


/// Admin Home 


app.get("/adminHome", isAuth, async (req, res) => {
    if (req.isAuthenticated()) {
        const AllTeam = await Team.find({});

        res.render("adminHome.ejs", { team: AllTeam });
    }
    else {
        res.redirect("/adminLogin");
    }
});



// post for adding new center

app.get("/addTeam", isAuth, (req, res) => {
    if (req.isAuthenticated()) {
        res.render("addTeam");
    } else {
        res.redirect("/adminLogin");
    }
});


app.post("/addTeam", isAuth, async (req, res) => {
    if (req.isAuthenticated()) {
        let Num = req.body.matchNo
        Num = (Num === '') ? 0 : Num;
        const newTeam = new Team({
            tname: req.body.tname,
            teamId: req.body.teamId,
            matchNo: Num
        });
        await newTeam.save();
        res.redirect('/adminHome');
    } else {
        res.redirect("/adminLogin");
    }

});


/// Result Declare Hear 
app.get('/admin/result', async (req, res) => {
    if (req.isAuthenticated()) {
        const dataTeam = await Team.find({});
        const AllTeam = dataTeam.filter(Team => Team.matchNo !== null);
        // // console.warn(AllTeam); 
        let firstTeam = [];
        let secondTeam = [];
        const midpoint = Math.ceil(AllTeam.length / 2);
        //  // console.warn("Midpoint"+midpoint);
        for (let i = 1; i <= midpoint; i++) { 
            let filteredData = AllTeam.filter(item => item.matchNo === i);
            if (filteredData) {                
                firstTeam.push(filteredData[0]);
                secondTeam.push(filteredData[1]);
            }
        }
        // // console.warn(firstTeam);
        // // console.warn(secondTeam);
        res.status(201).render('resultDec.ejs', { team1: firstTeam, team2: secondTeam });
    } else {
        res.redirect("/adminLogin");
    }
})



app.post("/admin/result", async (req, res) => {
    if (req.isAuthenticated()) {
        const Allsubmited = await Input.find({});
        let result = req.body;
        const newResult = new Result(result);
        await newResult.save();
        try {

            for (let i = 0; i < Allsubmited.length; i++) {
                let count = 0;
                const keys = Object.keys(result);
                const numKeys = keys.length;
                for (let j = 1; j <= numKeys; j++) {

                    // // console.warn(Allsubmited[i][j]);
                    // // console.warn(result[j]);

                    if (Allsubmited[i][j] == result[j]) {
                        count++;
                    }
                }
                let mail = Allsubmited[i].email
                const userOne = await User.findOne({ email: mail });
                let newPoint = count + userOne.points
                await User.findByIdAndUpdate(userOne._id, { $set: { points: newPoint } })
                // // console.warn(userOne.points);
                // // console.warn(count);
            }
        } catch (error) {
            // console.warn(error);
        }
        res.redirect("/adminHome");

    } else {
        res.redirect("/adminLogin");
    }
});


//// Set Matches  by admin
app.get("/admin/setmatchs", async (req, res) => {
    if (req.isAuthenticated()) {
        const AllTeam = await Team.find({});

        res.render("nextmatch.ejs", { team: AllTeam });
    } else {
        res.redirect("/adminLogin");
    }

});
app.post("/admin/setmatchs", async (req, res) => {
    if (req.isAuthenticated()) {
        const setmatchs = req.body;
        var keys = Object.keys(setmatchs);
        // // console.warn(keys);
        // const AllTeam = await Team.find({});
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let ans = setmatchs[key]
            await Team.findByIdAndUpdate(key, { $set: { matchNo: ans } })

        }
        res.redirect("/adminHome");
    } else {
        res.redirect("/adminLogin");
    }
});


//isAuth function
async function isAuth(req, res, next) {
    if (req.isAuthenticated()) {
        const adm = await Admin.findById(req.user).exec();
        // // console.log(adm);
        if (adm != undefined) return next();
        else res.redirect("/adminLogin");
    }
    else res.redirect("/adminLogin");
}



//admin logout 
app.get("/adminLogout", (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/adminLogin');
    });
});






//listen to port 
app.listen(PORT,() => {
    // console.log(`Server is running in http://localhost:${PORT} OR http://127.0.0.1:${PORT}`);
});
