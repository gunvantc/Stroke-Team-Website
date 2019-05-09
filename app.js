// Stroke Team Entry Point

// REQUIRE STATEMENTS
var express        = require("express"),
    app            = express(),
    bodyParser     = require("body-parser"),
    mongoose       = require("mongoose"),
    passport       = require("passport"),
    LocalStrategy  = require("passport-local"),
    User           = require("./models/user"),
    preference     = require("./models/preference"),
    Schema         = mongoose.Schema;
    auth           = require("./controllers/AuthController.js");
    ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
    cookieParser   = require("cookie-parser"),
    querystring    = require('querystring'),
    xkcd           = require('xkcd-api');
    nodemailer     = require('nodemailer');


// APP CONFIG
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
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

passport.serializeUser(function(user, done) {
  done(null, user.id);
  // console.log("serializing");
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
  // console.log("deserializing");
});

// MONGODB CONFIG
// var dburl = "mongodb://localhost:27017/Stroke_Team";
// var dburl = "mongodb://admin_user:Stroke19@ds151994.mlab.com:51994/stroke_team";
mongoose.connect(process.env.MONGODB_URI);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


// SETTING UP MONGODB SCHEMAS
var timeInLogSchema = new Schema({
    member: { type: Schema.Types.ObjectId, ref: 'User'},
    start: {type: Date, default: Date.now},
    end: {type: Date, default: null},
    dur: Number, //in ms
    quarter: {
        season: String,
        year: Number
    },
    shiftType: {type: String, enum: ['Neuroround','ED Shift']},
    active: {type: Boolean, default: true}
});
timeInLogSchema.virtual("printLog").get(function() {
    sTime = this.start;
    duration = this.dur;
    return [(this.member.fName + ' ' + this.member.lName.substring(0,1) + '.'), sTime, duration];
})
var timeInLog = mongoose.model('timeInLog',timeInLogSchema);

var configSchema = new Schema({
    quarter: { 
        season: String,
        year: Number
    },
    loc: {
        type: {type: String},
        coordinates: [Number]
    },
    activePrefs: [{
        season: String,
        year: Number,
        weeks: Number
    }],
    createdPrefs: [{
        season: String,
        year: Number,
        weeks: Number
    }],
    makeUnique: {type: String, unique: true}
});
configSchema.index({"loc":"2dsphere"});
// configScehma.index({"activePrefs.season": 1, "activePrefs.year": 1});
var configSetting = mongoose.model('configSetting',configSchema);
myConfig = new configSetting({ 
    quarter: {season: 'Winter Quarter', year:2019},
    "loc": { "type":"Point", "coordinates":[-118.123,34.123]},
    activePrefs: [ {season: 'Winter Quarter', year:2019, weeks: 1}, {season: 'Winter Finals', year:2019, weeks: 1}, {season: 'Spring Break', year:2019, weeks: 2}],
    createdPrefs: [ {season: 'Winter Quarter', year:2019, weeks: 1}, {season: 'Winter Finals', year:2019, weeks: 1}, {season: 'Spring Break', year:2019, weeks: 2}],
    makeUnique: "my name is jeff"
});
myConfig.save(function(err,myConfig) {
    if (err) return console.error(err);
});


//setting up admin account for access
adminUser = new User({
    username: 'sstcoords@gmail.com',
    fName: 'Admin',
    lName: 'Coord',
    tb: new Date(2000,0,1),
    admin: true,
    current: false
});

User.register(adminUser, 'stroke19', function(err, user) {
    if (err) {
      console.log("register failed");
      console.log(err);
    }
})


// ROUTES

// landing-login page
app.get("/", function(req, res){
    // TODO: Check if you are signed in!!
    if (req.user)
        res.redirect("/stats");
    else{
        
        reqMessage = null;
        if (req.session.message){
            reqMessage = req.session.message;
            req.session.message = null;
        }
        res.render("landing-login", {
            message: reqMessage
        });
    }
});

// // SIGN-UP LOGIC - This is only for testing right now
// app.get("/register", function(req, res){
//     res.render("register");
// });

// // REGISTER - WILL BE MOVED TO ADMIN EVENTUALLY
// app.post("/register", function(req, res){
//     var newUser = new User({username: req.body.username, name: req.body.name});
//     User.register(newUser, req.body.password, function(err, user){
//         if(err){
//             console.log("register failed");
//             console.log(err);
//             return res.redirect("/");
//         }
//         passport.authenticate("local")(req, res, function(){
//            res.redirect("/");
//         });
//     });
// });

// // LOGIN LOGIC
// app.post("/", passport.authenticate("local",
//     {
//         successRedirect: "/stats",
//         failureRedirect: "/"
//     }),function(req, res){
// });

// // LOGOUT ROUTE
// app.get("/logout", function(req, res){
//     req.logout();
//     res.redirect("/");
// });


// route to register page
app.get('/register', auth.register);

// route for register action
app.post('/register', auth.doRegister);

// route for login action
app.post('/', auth.doLogin);

// route for logout action
app.get('/logout', auth.logout);

app.get('/attempt', function(req,res){
    console.log("wtf is going on?");
    res.render("landing-login", {
        message: "Wrong username and password combination."
    });
});


//Restrict admin acceses
var requiresAdmin = function() {
  return [
    ensureLoggedIn('/stats'),
    function(req, res, next) {
      if (req.user && req.user.admin == true)
        next();
      else
        res.send(401, 'Unauthorized page bruh');
    }
  ]
};

// to restrict routes that should be logged in
function loggedIn(req,res,next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/');
    }
}

app.all('/admin/*', requiresAdmin());

app.get("/forgot-pw", function(req,res){

    reqMessage = null;
    if (req.session.message){
        reqMessage = req.session.message;
        req.session.message = null;
    }

    res.render("forgot_password", {
        message: reqMessage,
    });
});
app.post("/forgot-pw", function(req,res){

    User.find({username: req.body.username}, function(err,users){
        if(err)
            console.log(err)

        if(users.length>0) {


            var token = '';
            for (var i = 0; i<10; i++){
                token += Math.floor((Math.random() * 10));
            }

            //setting up email transporter
            var transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: 'ucla.sst.coords@gmail.com',
                pass: 'Stroke19'
              }
            });
            var mailOptions = {
              from: 'ucla.sst.coords@gmail.com',
              to: req.body.username,
              subject: 'SST Password Reset',
              text: ('Please visit https://stroketeam.herokuapp.com/reset-pw and use this token to reset your password ' + token)
            };

            transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                console.log(error);
              } else {
                console.log('Email sent: ' + info.response);
              }
            });

            users[0].token = parseInt(token);

            users[0].markModified("token");

            users[0].save(function(err){
                if (err)
                    console.log(err)

                req.session.message = 'Please check email for further instructions';
                res.redirect("/forgot-pw");
            })

        } else {
            req.session.message='Username not found in system';
            res.redirect("/forgot-pw");
        };
    });
});

app.get("/reset-pw", function(req,res){

    reqMessage = null;
    if (req.session.message){
        reqMessage = req.session.message;
        req.session.message = null;
    }
    res.render("reset_password", {
        message: reqMessage,
    });
});
app.post("/reset-pw", function(req,res){
    if(req.body.password == req.body.password_confirm){
        User.findByUsername(req.body.username).then(function(thisUser){
            if (thisUser) {
                if (parseInt(req.body.token) != -1580382183){
                    if(parseInt(req.body.token) == thisUser.token){
                        //everything has been verified

                        thisUser.setPassword(req.body.password, function(){
                            thisUser.token = -1580382183;
                            thisUser.save();
                            req.session.message = "Password reset successful";
                            res.redirect("/")
                        })
                        //save user
                    } else{
                        req.session.message = "Wrong token!";
                        res.redirect("/reset-pw");
                    }

                } else {
                    req.session.message = "Wow you hacked me, congrats. Please spare me :'( ";
                    res.redirect("/reset-pw");
                }

            } else{
                req.session.message = "Username not found in system";
                res.redirect("/reset-pw");
            }
        }, function(err){
            console.log(err);
        });

    } else{
        req.session.message = "Passwords do not match!";
        res.redirect("/reset-pw");
    }
});

// TIMECARD ROUTE (SHOULD BE GEOGRAPHICALLY BLOCKED)
app.get("/timecard", function(req, res){
    // TODO: make separate dialog/text if not geographically correct

    timeInLog.find({active: true}, function(err,timeStamps) {
        if (err)
            console.log(err);
        
        console.log(timeStamps.length);
        var time_ins = [];
        var shift_type = [];
        var tb_test = [];
        var tb_status = [];
        
        var renderTC = function(){
            console.log(time_ins);
            console.log(shift_type);
            console.log(tb_test);
            console.log(tb_status);

            configSetting.find({}, function(err,configs) {
                
                thisCon = configs[0];

                res.render("timecard", {
                    time_ins: time_ins,
                    shift_type: shift_type,
                    tb_test: tb_test,
                    tb_status: tb_status,
                    target_loc: thisCon.loc
                    });
            });
        };

        if(timeStamps.length>0) {
            thisStamp = timeStamps[0];
            shift_type.push(thisStamp.shiftType);

            User.findById(thisStamp.member, function(err,thisMember) {
                if (err)
                    console.log(err);
                console.log(thisMember);
                if(thisMember) {

                    time_ins.push(thisMember.fName + " " + thisMember.lName);

                    console.log(thisMember.fName + " " + thisMember.lName);

                    var tb_date = new Date(thisMember.tb);
                    var cur_date = new Date(Date.now());

                    console.log(cur_date.getTime());

                    if (tb_date<cur_date) {
                        tb_status.push('expired');
                        tb_test.push('has expired!');
                    } else {
                        tb_status.push('valid');
                        var one_day = 24*60*60*1000;
                        var diff_days = Math.round(Math.abs( (tb_date.getTime()-cur_date.getTime()) / one_day ));
                        tb_test.push('will expire in ' + diff_days.toString() + ' days!');
                    }
                }


                if(timeStamps.length>1) {
                    thisStamp = timeStamps[1];
                    shift_type.push(thisStamp.shiftType);

                    User.findById(thisStamp.member, function(err,thisMember) {
                        if (err)
                            console.log(err);
                        console.log(thisMember);
                        if(thisMember) {

                            time_ins.push(thisMember.fName + " " + thisMember.lName);

                            console.log(thisMember.fName + " " + thisMember.lName);

                            var tb_date = new Date(thisMember.tb);
                            var cur_date = new Date(Date.now());

                            console.log(cur_date.getTime());

                            if (tb_date<cur_date) {
                                tb_status.push('expired');
                                tb_test.push('has expired!');
                            } else {
                                tb_status.push('valid');
                                var one_day = 24*60*60*1000;
                                var diff_days = Math.round(Math.abs( (tb_date.getTime()-cur_date.getTime()) / one_day ));
                                tb_test.push('will expire in ' + diff_days.toString() + ' days!');
                            }
                        }

                        if(timeStamps.length>2) {
                            thisStamp = timeStamps[2];
                            shift_type.push(thisStamp.shiftType);

                            User.findById(thisStamp.member, function(err,thisMember) {
                                if (err)
                                    console.log(err);
                                console.log(thisMember);
                                if(thisMember) {

                                    time_ins.push(thisMember.fName + " " + thisMember.lName);

                                    console.log(thisMember.fName + " " + thisMember.lName);

                                    var tb_date = new Date(thisMember.tb);
                                    var cur_date = new Date(Date.now());

                                    console.log(cur_date.getTime());

                                    if (tb_date<cur_date) {
                                        tb_status.push('expired');
                                        tb_test.push('has expired!');
                                    } else {
                                        tb_status.push('valid');
                                        var one_day = 24*60*60*1000;
                                        var diff_days = Math.round(Math.abs( (tb_date.getTime()-cur_date.getTime()) / one_day ));
                                        tb_test.push('will expire in ' + diff_days.toString() + ' days!');
                                    }
                                }

                                renderTC();
                            });
                        } else
                            renderTC();
                    });
                } else
                    renderTC();
            });
        } else
            renderTC();

    })

});

app.post("/timecard", passport.authenticate("local", { failureRedirect: '/timecard' }), function(req, res){

       //authetication successful
        //check if any time log is active
        //if it is, make it inactive and set duration
        //if no time log is active, make a new time log

        console.log("successful authetication");
        
        configSetting.find({},function(err,configs) {

            thisCon = configs[0];

            userId = req.user.id;
            timeInLog.find({member: req.user.id, active: true, shiftType: req.body.shiftType}, function(err,timeStamp) {
                if(err){
                    conosle.log(err);
                }
                if (!timeStamp.length){
                    //make a new time log

                    console.log("making new timelog");

                    var timeLogInstance = new timeInLog({
                        member: userId,
                        'quarter.season': thisCon.quarter.season,
                        'quarter.year': thisCon.quarter.year,
                        shiftType: req.body.shiftType
                    });

                    timeLogInstance.save();


                } else {
                    console.log("changing old timelog");
                    
                    thisStamp = timeStamp[0];
                    thisStamp.end = Date.now();
                    thisStamp.active = false;
                    thisStamp.dur = thisStamp.end.getTime() - thisStamp.start.getTime();
                    thisStamp.save();
                }

            });

            req.logout();

            res.redirect("/timecard");
        });
    });


// temporary route for preferences
app.get("/preferences",  loggedIn, function(req, res, next){
// app.get("/preferences", function(req, res, next){
    // check if logged in/admin
    // pass in all required information from database about
    // current preferences
    

    configSetting.find({}, function(err,configs) {
        if(err)
            console.log(err)

        thisCon = configs[0];

        var render = function() {

            if (req.session.error){
                console.log(req.session.error);
            }

            //reset error 
            error2 = req.session.error;
            req.session.error = null;

            console.log(req.user.id);
            console.log(req.session.week);
            console.log(req.session.season);
            console.log(req.session.year);

            preference.find({
                member: req.user.id, 
                week: req.session.week, 
                'quarter.season': req.session.season, 
                'quarter.year': req.session.year
            }, function(err,prefs) {

                //create prefs data list
                prefData = [];

                console.log(prefs.length);

                for (var i = 0; i < prefs.length; i++) {
                    thisPref = prefs[i];

                    prefData.push(thisPref.arrangedData);
                }

                console.log(prefData);

                res.render("preferences",{ 
                    week: req.session.week,
                    prefs: thisCon.activePrefs,
                    season: req.session.season,
                    year: req.session.year,
                    numWeeks: req.session.numWeeks,
                    error: req.session.error,
                    data: prefData,
                    fullName: (req.user.fName + ' ' + req.user.lName)
                });
            })
        }

        if(!req.session.season) {
            req.session.season = thisCon.activePrefs[0].season;
            req.session.year = thisCon.activePrefs[0].year;
            req.session.numWeeks = thisCon.activePrefs[0].weeks;
            req.session.week = 1;
        }

        if(!req.session.numWeeks) {
            for (var i = 0; i<thisCon.activePrefs.length; i++) {
                if ((thisCon.activePrefs[i].season == req.session.season) && (thisCon.activePrefs[i].year == req.session.year))
                    req.session.numWeeks = thisCon.activePrefs[i].weeks;
            }
        }

        if(!req.session.error){
            req.session.error = null;
        }

         render();
        

    });

    
});
app.get("/preferences/:season/:year", function(req,res){
    req.session.season = req.params.season;
    req.session.year = req.params.year;
    req.session.week = 1;

    //This var will be reset in render function, because it already makes a call then
    delete(req.session.numWeeks);

    res.redirect("/preferences");
});
app.post("/preferences/delete/:oid",function(req,res){
    console.log('oid');
    console.log(req.params.oid);
    preference.findByIdAndDelete(req.params.oid, function(err) {
        if (err)
            console.log(err);
        
        console.log('deleted preference');

        res.redirect("/preferences");
    })
});
app.post("/lscrl", function(req, res){
    //logic for whenever a button is pressed
    // var scrl= 'left';
    // req.session.scrl = scrl;
    req.session.week -= 1;
    if (req.session.week < 1) {
        req.session.week = req.session.numWeeks;
    }
    res.redirect("/preferences")
});
app.post("/rscrl", function(req, res){
    //logic for whenever a button is pressed
    // var scrl= 'right';
    // req.session.scrl = scrl;
    req.session.week += 1;
    if (req.session.week > req.session.numWeeks) {
        req.session.week = 1;
    }
    res.redirect("/preferences")
});
app.post("/red_submit", function(req,res){
    //add shit to the database
    console.log("add red");

    // start = parseInt(req.body.startTime.split(' ')[0].split(':')[0]);
    // console.log(start);
    // var error = null;
    // if (start<8 && start>0){
    //     error = 'Preference not saved!\nInvalid start time entered';
    //     console.log("this is an error!");
    // } else {
    addPref(req,res,'red');
    //}
    
    // req.session.error = error;
    res.redirect("/preferences");
});
app.post("/green_submit", function(req,res){
    //add shit to the database
    console.log("add green");
    addPref(req,res,'green')
    res.redirect("/preferences");
});

//adds shit to the database
var addPref = function(req,res,myclass) {
    var day=0;

    switch (req.body.selectDay) {
        case "Sunday":
            day = 0;
            break;
        case "Monday":
            day = 1;
            break;
        case "Tuesday":
            day = 2;
            break;
        case "Wednesday":
            day = 3;
            break;
        case "Thursday":
            day = 4;
            break;
        case "Friday":
            day = 5;
            break;
        case "Saturday":
            day = 6;
            break;
        default:
            day = 0;
    }

    var bodySTime = req.body.startTime;
    var sHr = parseInt(bodySTime.split(' ')[0].split(':')[0]);
    var sMin = parseInt(bodySTime.split(' ')[0].split(':')[1]);
    if (bodySTime.split(' ')[1] == 'pm'){
        sHr += 12;
    }
    //if 12am, make hour 24
    if ((sHr == 12) && (bodySTime.split(' ')[1] == 'am')) {
        sHr += 12;
    };
    var sTime = sHr+ ':' + sMin;

    var bodyETime = req.body.endTime;
    var eHr = parseInt(bodyETime.split(' ')[0].split(':')[0]);
    var eMin = parseInt(bodyETime.split(' ')[0].split(':')[1]);
    if (bodyETime.split(' ')[1] == 'pm'){
        eHr += 12;
    }
    //if 12am, make hour 24
    if ((eHr == 12) && (bodyETime.split(' ')[1] == 'am')) {
        eHr += 12;
    };
    var eTime = eHr+ ':' + eMin;

    var durMin = (eHr*60+eMin) - (sHr*60+sMin);

    var duration = Math.floor(durMin/60) + ':' + Math.floor(durMin%60);

    console.log(bodySTime);
    console.log(bodyETime);


    console.log(sTime);
    console.log(eTime);


    var newPref = new preference ({
        member: req.user.id,
        color: myclass,
        week: req.session.week,
        day: day,
        quarter: {
            season: req.session.season,
            year: req.session.year
        },
        sTime: sTime,
        duration: duration,
        comment: req.body.comments
    });

    newPref.save(function(err){
        if (err) throw err;

        console.log("preference added")


    })
}




// USER STATISTICS
app.get("/stats", loggedIn, function(req, res, next){
    configSetting.find({}, function(err,configs) {
        if(err)
            console.log(err)

        thisCon = configs[0];

        var render = function() {

            res.render("user_stats",{ 
                prefs: thisCon.activePrefs,
                fName: req.user.fName,
                lName: req.user.lName,
                email: req.user.username,
                tb: req.user.tb,
                admin: req.user.admin,
                active: req.user.active,
                recentLogs: recentLogs,       //recent time ins
                studentHrs: studentHrs,//all students hours
                quarterHrs: quarterHrs,
                //hour graph all time
                //mechanism for quarter hours (load with current quarter): needs to be a post type shit
                quarters: quarters,//all quarters (options for table)
                curQuarter: thisCon.quarter,
                timeIns: timeIns,
                fullName: (req.user.fName + ' ' + req.user.lName)
            });
        };

        studentHrs = [];
        quarterHrs = [];
        quarters= [];
        recentLogs = [];
        timeIns = [];
        timeInLog.find().populate('member').sort('-start').limit(5).exec(function(err,logs) {
            if (err)
                console.log(err);
            for (var i = 0; i<logs.length; i++) {
                thisLog = logs[i];
                recentLogs.push(thisLog.printLog); //last 5 time-ins
            }

            timeInLog.aggregate([
                //{ $match: { $and: [ {quarter: {season: thisCon.quarter.season}}, {quarter: {year:thisCon.quarter.year}}] } },
                { $match: {quarter: thisCon.quarter} },
                { $lookup: {"from":"users", "localField":"member", "foreignField":"_id", "as":"student"}},
                { $group: { _id: "$student", totalTime: { $sum: "$dur" }}}
            ], function(err,allMembers){

                studentHrs = allMembers;

                timeInLog.aggregate([
                    { $match: {member: new mongoose.Types.ObjectId(req.user.id)} },                    
                    { $group: { _id: "$quarter", totalTime: {$sum: "$dur"}}}
                ], function(err,allQuarters){

                    quarterHrs = allQuarters;
                    timeInLog.distinct('quarter', function(err, all_quarters) {
                        quarters = all_quarters;

                        if(!req.session.queryQuarter)
                            req.session.queryQuarter = thisCon.quarter;

                        timeInLog.find({member:req.user.id,quarter:req.session.queryQuarter}).sort('-start').exec(function(err,qLogs) {
                            timeIns = qLogs;
                            render();
                        })
                    });
                });
            });
        });




    });
});
app.post("/update_quarter",function(req,res){

    req.session.queryQuarter = {season:req.body.updateQuarter.substring(5), year: parseInt(req.body.updateQuarter)};
    console.log(req.session.queryQuarter);
    res.redirect("/stats");
});


// // USER SCHEDULE INTERFACE
// app.get("/schedule", function(req, res){
//     res.render("schedule");
// });

// FOR ALL ADMIN PRIVILEDGES - DEV ONLY
app.get("/admin", loggedIn, function(req, res, next){
    configSetting.find({}, function(err,configs) {
        if(err)
            console.log(err)

        thisCon = configs[0];
        User.find({}, function(err, allUsers){
            if(err)
                console.log("Error in finding all users: " + err);
            else {

                xkcd.random(function(err,image_res) { 
                    if(err)   
                        console.log(err);

                    res.render("admin", {
                        allUsers: allUsers,
                        prefs: thisCon.activePrefs,
                        xkcdURL: image_res.img,
                        fullName: (req.user.fName + ' ' + req.user.lName)
                    });
                });
            }
        });
    });
});

app.get("/admin/time-ins", function(req, res){
    configSetting.find({}, function(err,configs) {
        if(err)
            console.log(err)

        thisCon = configs[0];
        

    	if(!req.session.page){
    		req.session.page = 1;
    	}

    	timeInLog.find().populate('member').sort('-start').limit(15).skip(15* (req.session.page-1)).exec(function(err,qlogs){
	        if (err)
	        	console.log(err);
	        if(qlogs.length<1 && req.session.page>1) {
	        	req.session.page-=1;
	        	res.redirect('/admin/time-ins');
	        }
	        console.log(qlogs);
	        res.render("admin_time_ins", {
	            prefs: thisCon.activePrefs,
	            fullName: (req.user.fName + ' ' + req.user.lName),
	            page: req.session.page,
	            entries: qlogs
	        });
        })
        

    });
});
app.post("/admin/time-ins/lscrl", function(req,res) {
	req.session.page -= 1;
	if (req.session.page == 0)
		req.session.page = 1;
	res.redirect("/admin/time-ins");
});

app.post("/admin/time-ins/rscrl", function(req,res) {
	req.session.page += 1;
	res.redirect("/admin/time-ins");
});

app.get("/admin/student-list", function(req, res){
    configSetting.find({}, function(err,configs) {
        if(err)
            console.log(err)

        thisCon = configs[0];
        
        User.find({}, function(err, allUsers){
           

            res.render("admin_students", {
                prefs: thisCon.activePrefs,
                fullName: (req.user.fName + ' ' + req.user.lName),
                allUsers: allUsers
            });

        });
    });
});
app.post("/admin/admin_students/add", function(req,res){
    newUser = new User({
        username: req.body.username,
        fName: req.body.fName,
        lName: req.body.lName,
        tb: req.body.tbExp,
        admin: false,
        current: true
    });

    User.register(newUser, req.body.password, function(err, user) {
        if (err) {
          console.log("register failed");
          console.log(err);
        }

        res.redirect('/admin/student-list');
    });
});

app.get("/admin/student-hours", function(req, res){
    configSetting.find({}, function(err,configs) {
        if(err)
            console.log(err)

        thisCon = configs[0];

        if(!req.session.shQuarter){
            req.session.shQuarter = thisCon.quarter;
        }

        //- Unique quarters availabile
        //- For currently selected quarter (need sessh var for that), query for all time-ins, for each student
        timeInLog.aggregate([
                //{ $match: { $and: [ {quarter: {season: thisCon.quarter.season}}, {quarter: {year:thisCon.quarter.year}}] } },
                { $match: {quarter: req.session.shQuarter} },
                { $group: { _id: "$member", totalTime: { $sum: "$dur" }}}
            ], function(err,allMemberTotals){

                timeInLog.aggregate([
                //{ $match: { $and: [ {quarter: {season: thisCon.quarter.season}}, {quarter: {year:thisCon.quarter.year}}] } },
                    { $match: {quarter: req.session.shQuarter} },
                    { $group: { _id: "$member", logs: { $push: "$$ROOT" }}}
                ], function(err,allMemberLogs){

                    console.log(allMemberTotals);
                    console.log(allMemberLogs);

                    User.find({current: true}).sort("lName").exec(function(err,allUsers){
                        console.log(allUsers);
                       timeInLog.distinct('quarter', function(err, all_quarters) {
                           res.render("admin_hours", {
                                prefs: thisCon.activePrefs,
                                fullName: (req.user.fName + ' ' + req.user.lName),
                                users: allUsers,
                                allLogs: allMemberLogs,
                                totals: allMemberTotals,
                                quarters: all_quarters,
                                sessQuarter: req.session.shQuarter
                            });
                       });
                    });
                });
        })

    });
});
app.post("/admin/student-hours/add/:logID", function(req,res){ //for the edit function
    if(req.params.logID == "null"){

        console.log('adding new time log');
        dateIn = req.body.dateIn;
        timeIn = req.body.timeIn;
        timeOut = req.body.timeOut;

        startD = new Date(dateIn+ 'T' + timeIn);
        endD = new Date(dateIn+ 'T' + timeOut);
        
        User.find({fName: req.body.fName, lName: req.body.lName}, function(err, users){
            if (users.length>0){
                newLog = new timeInLog({
                    member: users[0]._id,
                    start: startD,
                    end: endD,
                    dur: (endD.getTime()-startD.getTime()), //in ms
                    quarter: req.session.shQuarter,
                    shiftType: req.body.shiftType,
                    active: true
                });
                newLog.save(function(err){
                    if (err)
                        console.log(err)

                    res.redirect("/admin/student-hours");
            
                });
            } else {
                res.redirect("/admin/student-hours");
            }
        });
    }
    else {
        console.log('editing old time log');
        timeInLog.findById(req.params.logID, function(err,log){
            if (err)
                console.log(err)

            dateIn = req.body.dateIn;
            timeIn = req.body.timeIn;
            timeOut = req.body.timeOut;
            startD = new Date(dateIn+ 'T' + timeIn);
            endD = new Date(dateIn+ 'T' + timeOut);
            
            log.start = startD;
            log.end = endD;
            log.dur = endD.getTime()-startD.getTime();
            log.shiftType = req.body.shiftType;
            log.active = false;

            log.markModified("start");
            log.markModified("end");
            log.markModified("dur");
            log.markModified("shiftType");
            log.markModified("active");

            log.save(function(err){
                if (err)
                    console.log(err)

                res.redirect("/admin/student-hours");
            })

        })
    }
});
app.post("/admin/student-hours/changeQuarter", function(req,res){
    req.session.shQuarter = req.body.updateQuarter;
    res.redirect("/admin/student-hours");
});
app.post("/admin/student-hours/delete/:logID",function(req,res){
    timeInLog.findByIdAndRemove(req.params.logID,function(err){
        if (err)
            console.log(err);

        res.redirect("/admin/student-hours");
    })
});

app.get("/admin/preferences", function(req, res){
    
    configSetting.find({}, function(err,configs) {
        if(err)
            console.log(err)

        thisCon = configs[0];

        var render = function() {

            if (req.session.error){
                console.log(req.session.error);
            }

            //reset error 
            error2 = req.session.error;
            req.session.error = null;

            console.log(req.session.selected_member);
            console.log(req.session.week);
            console.log(req.session.season);
            console.log(req.session.year);

            preference.find({
                member: req.session.selected_member, 
                week: req.session.week, 
                'quarter.season': req.session.season, 
                'quarter.year': req.session.year
            }, function(err,prefs) {

                //create prefs data list
                prefData = [];

                console.log(prefs.length);

                for (var i = 0; i < prefs.length; i++) {
                    thisPref = prefs[i];

                    prefData.push(thisPref.arrangedData);
                }

                console.log(prefData);

                User.find({}, function(err, allUsers){
                    console.log(req.session.year)
                    console.log(req.session.season)
                    res.render("admin_preferences",{ 
                        week: req.session.week,
                        prefs: thisCon.activePrefs,
                        season: req.session.season,
                        year: req.session.year,
                        numWeeks: req.session.numWeeks,
                        error: req.session.error,
                        data: prefData,
                        fullName: (req.user.fName + ' ' + req.user.lName),
                        allMembers: allUsers,
                        selecMember: req.session.selected_member,
                        selecMemberName: req.session.selected_member_name
                    });
                });
            })
        }

        if(!req.session.season) {
            req.session.season = thisCon.activePrefs[0].season;
            req.session.year = thisCon.activePrefs[0].year;
            req.session.numWeeks = thisCon.activePrefs[0].weeks;
            req.session.week = 1;
        }

        if(!req.session.numWeeks) {
            for (var i = 0; i<thisCon.activePrefs.length; i++) {
                if ((thisCon.activePrefs[i].season == req.session.season) && (thisCon.activePrefs[i].year == req.session.year))
                    req.session.numWeeks = thisCon.activePrefs[i].weeks;
            }
        }

        if(!req.session.selected_member){
            req.session.selected_member = req.user.id;
            req.session.selected_member_name = req.user.fName + ' ' + req.user.lName;
        }

        if(!req.session.error){
            req.session.error = null;
        }

        render();
        
    });
});
app.post("/admin/preferences/changeSeason", function(req,res){
    const seasonNum = req.body.seasonSelect;

    configSetting.find({}, function(err,configs) {
        if(err)
            console.log(err)

        thisCon = configs[0];

        req.session.season = thisCon.activePrefs[seasonNum].season;
        req.session.year = thisCon.activePrefs[seasonNum].year;
        req.session.week = 1;

        //This var will be reset in render function, because it already makes a call then
        delete(req.session.numWeeks);

        res.redirect("/admin/preferences");
    })
});
app.post("/admin/preferences/changeStudent", function(req,res){
    
    req.session.selected_member = req.body.studentSelect;

    User.findById(req.session.selected_member, function(err, user) {
        req.session.selected_member_name = user.fName + ' ' + user.lName;
        res.redirect("/admin/preferences");
    });
});
app.post("/admin/preferences/lscrl", function(req, res){
    //logic for whenever a button is pressed
    req.session.week -= 1;
    if (req.session.week < 1) {
        req.session.week = req.session.numWeeks;
    }
    res.redirect("/admin/preferences")
});
app.post("/admin/preferences/rscrl", function(req, res){
    //logic for whenever a button is pressed
    req.session.week += 1;
    if (req.session.week > req.session.numWeeks) {
        req.session.week = 1;
    }
    res.redirect("/admin/preferences")
});

app.get("/admin/settings", function(req, res){
    configSetting.find({}, function(err,configs) {
        if(err)
            console.log(err)

        var thisCon = configs[0];
        
        console.log("about to render settings");
        res.render("admin_settings", {

            prefs: thisCon.activePrefs,
            fullName: (req.user.fName + ' ' + req.user.lName),

            curQuarter: thisCon.quarter,
            createdPrefs: thisCon.createdPrefs,
            timecardLoc: thisCon.loc,

        });
        

    });
});
app.post("/admin/admin_settings/changeQuarter", function(req,res){
    configSetting.find({}, function(err,configs) {
        if(err)
            console.log(err)

        var thisCon = configs[0];
        thisCon.quarter.season = req.body.curSeason;
        thisCon.quarter.year = req.body.curYear;
        thisCon.save(function(err){
            if (err)
                console.log("There was an error!",err)
            
            console.log("cur quarter changed")
            res.redirect('/admin/settings');
        });
    });

});
app.post("/admin/admin_settings/setLoc", function(req,res){
    configSetting.find({}, function(err,configs) {
        if(err)
            console.log(err)

        var thisCon = configs[0];

        thisLoc = req.body.longLat;
        if (thisLoc.split(', ').length > 1) {
            thisCon.loc.coordinates[0] = parseFloat(thisLoc.split(', ')[0]);
            thisCon.loc.coordinates[1] = parseFloat(thisLoc.split(', ')[1]);
            console.log(thisCon.loc.coordinates);
            console.log("new location found");
        }
        thisCon.markModified("loc");
        thisCon.save(function(err){
            if (err)
                console.log("There was an error!",err)

            console.log("location saved")
            res.redirect('/admin/settings');
        });
    });
});
app.post("/admin/admin_settings/active_toggle/:prefYear/:prefSeason", function(req,res){
    var togQuarter = {season: req.params.prefSeason, year: parseInt(req.params.prefYear) };
    console.log(togQuarter);
    configSetting.find({}, function(err,configs) {
        if(err)
            console.log(err)

        var thisCon = configs[0];

        var found = false;

        for(var i = thisCon.activePrefs.length -1; i>=0; i--) {
            if ( (thisCon.activePrefs[i].season == togQuarter.season) && (thisCon.activePrefs[i].year == togQuarter.year) ){
                thisCon.activePrefs.splice(i,1);
                console.log("removing active pref");
                found = true;
                break;
            }
        }
        if(!found) {
            for(var i = thisCon.createdPrefs.length -1; i>=0; i--) {
                if ( (thisCon.createdPrefs[i].season == togQuarter.season) && (thisCon.createdPrefs[i].year == togQuarter.year) ){
                    thisCon.activePrefs.push(thisCon.createdPrefs[i]);
                    console.log("adding active pref");
                    break;
                }
            }     
        }

        thisCon.markModified("activePrefs");
        thisCon.save(function(err){
            if (err)
                console.log("There was an error!",err)

            console.log("pref quarter toggle saved")
            res.redirect('/admin/settings');
        });
    });
});
app.post("/admin/admin_settings/delete/:prefYear/:prefSeason", function(req,res){
    var delQuarter = { season: req.params.prefSeason, year: parseInt(req.params.prefYear) };
    console.log(delQuarter);

    configSetting.find({}, function(err,configs) {
        if(err)
            console.log(err)

        var thisCon = configs[0];

        for(var i = thisCon.createdPrefs.length-1; i>=0; i--) {
            if ( (thisCon.createdPrefs[i].season == delQuarter.season) && (thisCon.createdPrefs[i].year == delQuarter.year) ){
                thisCon.createdPrefs.splice(i,1);
                console.log("removing current pref");
                break;
            }
        }
        for(var i = thisCon.activePrefs.length-1; i>=0; i--) {
            if ( (thisCon.activePrefs[i].season == delQuarter.season) && (thisCon.activePrefs[i].year == delQuarter.year) ){
                thisCon.activePrefs.splice(i,1);
                console.log("removing current pref");
                break;
            }
        }

        thisCon.markModified("activePrefs");
        thisCon.markModified("createdPrefs");
        thisCon.save(function(err){
            if (err)
                console.log("There was an error!",err)

            console.log("pref quarter toggle saved")
            res.redirect('/admin/settings');
        });
    });
});
app.post("/admin/admin_settings/addPrefQuarter", function(req,res){
    configSetting.find({}, function(err,configs) {
        if(err)
            console.log(err)

        var thisCon = configs[0];

        prefQuarter = {season: req.body.prefSeason, year: req.body.prefYear, weeks: req.body.prefWeeks};

        thisCon.createdPrefs.push(prefQuarter);
        
        thisCon.markModified("createdPrefs");
        thisCon.save(function(err){
            if (err)
                console.log("There was an error!",err)

            console.log("add pref toggle saved")
            res.redirect('/admin/settings');
        });
    });
});


// START SERVER
app.listen(process.env.PORT || 3000, function(){
    console.log("Stroke Team Server has started on localhost:3000...");
});

app.use((err, req, res, next) => {
  // log the error...
  res.sendStatus(err.httpStatusCode).json(err)
})