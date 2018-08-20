// Stroke Team Entry Point

// REQUIRE STATEMENTS
var express        = require("express"),
    app            = express(),
    bodyParser     = require("body-parser"),
    mongoose       = require("mongoose"),
    passport       = require("passport"),
    LocalStrategy  = require("passport-local");

// APP CONFIG
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

// landing-login page    
app.get("/", function(req, res){
    res.render("landing-login");
});

// START SERVER
app.listen(3000, "localhost", function(){
    console.log("Stroke Team Server has started on localhost:3000...");
});
