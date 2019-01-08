var mongoose = require("mongoose");
var passport = require("passport");
var User = require("../models/user");

var userController = {};

// Restrict access to root page

// Go to registration page
userController.register = function(req, res) {
  res.render('register');
};

// Post registration
userController.doRegister = function(req, res) {
  User.register(new User({ username : req.body.username, fName: req.body.fName, lName: req.body.lName, tb: req.body.tb, admin: false, current: true  }), req.body.password, function(err, user) {
    if (err) {
      console.log("register failed");
      console.log(err);
      return res.render('register', { user : user });
    }

    passport.authenticate('local')(req, res, function () {
      res.redirect('/stats');
    });
  });
};

// Post login
userController.doLogin = function(req, res) {
  passport.authenticate('local', {
    successRedirect: '/stats',
    failureRedirect: '/attempt'
    })(req, res);
};

// logout
userController.logout = function(req, res) {
  req.logout();
  res.redirect('/');
  console.log("I logged out");
};

module.exports = userController;