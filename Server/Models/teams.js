const mongoose = require("mongoose");

//user schema
const teamSchema = new mongoose.Schema({
    tname:{type: String,  required: true},
    teamId:{type: Number, unique:true,  required: true},
    matchNo:{type: Number,  default: 0,  required: true }
});
const Team = mongoose.model("Team", teamSchema);

module.exports = Team;



