const mongoose = require("mongoose");

//user schema

const userInput = new mongoose.Schema({

    "1":Number,
    "2":Number,
    "3":Number,
    "4":Number,
    "5":Number,
    "6":Number,
    "7":Number,
    "8":Number,
    "9":Number,
    "10":Number,
    "11":Number,
    "12":Number,
    "13":Number,
    "14":Number,
    "15":Number,
    "16":Number


 

});

const Result = mongoose.model("Result", userInput);
module.exports = Result;



