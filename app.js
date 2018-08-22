// Stroke Team Entry Point

// REQUIRE STATEMENTS
var express        = require("express"),
    app            = express(),
    bodyParser     = require("body-parser"),
    mongoose       = require("mongoose"),
    passport       = require("passport"),
    LocalStrategy  = require("passport-local"),
    User           = require("./models/user");

// APP CONFIG
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");

// PASSPORT CONFIG
app.use(require("express-session")({
    secret: "i ain't gettin paid for this >:(",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// MONGODB CONFIG
var dburl = "mongodb://localhost:27017/Stroke_Team";
mongoose.connect(dburl);

// ROUTES

// landing-login page
app.get("/", function(req, res){
    res.render("landing-login");
});

// SIGN-UP LOGIC - This is only for testing right now

app.get("/register", function(req, res){
    res.render("register");
});

// REGISTER - WILL BE MOVED TO ADMIN EVENTUALLY
app.post("/register", function(req, res){
    var newUser = new User({username: req.body.username, email: req.body.email});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log("register failed");
            return res.redirect("/");
        }
        passport.authenticate("local")(req, res, function(){
           res.redirect("/");
        });
    });
});

// LOGIN LOGIC
app.post("/", passport.authenticate("local",
    {
        successRedirect: "/stats",
        failureRedirect: "/"
    }),function(req, res){
});

// LOGOUT ROUTE
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

// TIMECARD ROUTE (SHOULD BE IP BLOCKED)
app.get("/timecard", function(req, res){
    // TODO: add check for IP
    res.render("timecard");
});


// temporary route for preferences
app.get("/preferences", function(req, res){
    // check if logged in/admin
    // pass in all required information from database about
    // current preferences
    res.render("preferences");
});

app.post("/preferences", function(req, res){
    //logic for whenever a button is pressed
})

// USER STATISTICS
app.get("/stats", function(req, res){
    res.render("user_stats");
});

// USER SCHEDULE INTERFACE
app.get("/schedule", function(req, res){
    res.render("schedule");
});

// FOR ALL ADMIN PRIVILEDGES - DEV ONLY
app.get("/admin", function(req, res){
    User.find({}, function(err, allUsers){
        if(err)
            console.log("Error in finding all users: " + err);
        else
            res.render("admin", {allUsers: allUsers});
    });

app.get("/nr", function(req, res){
    res.render("neurorounds");
});

// START SERVER
app.listen(3000, "localhost", function(){
    console.log("Stroke Team Server has started on localhost:3000...");
});
