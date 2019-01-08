// USER MODEL

var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var Schema = mongoose.Schema;
var preference = require("../models/preference");

var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true}, // this is an email
    password: String,
 
    fName: String,
    lName: String,
    tb: Date,
    admin: Boolean,
    current: Boolean,

    token: {type: Number, default: -1580382183},

});


UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
