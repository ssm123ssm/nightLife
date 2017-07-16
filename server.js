//Packages
var express = require('express');
var mongo = require('mongodb').MongoClient;
var ejs = require('ejs');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var request = require('request');
var cors = require('cors');
var cleaner = require('./app/routes/cleaner');


//Configurations
var databases = require('./app/config/databases');
var pass_config = require('./app/auth/passport');

//Routes
var main_router = require('./app/routes/main_route');
var query_router = require('./app/routes/query_route');

//Debugging
function c(val) {
    console.log(val);
}
var app = express();

//Middleware configs
app.use(cookieParser());
//app.use(bodyParser());
app.use(cors());
app.use(session({
    secret: "Shh, its a secret!"
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('app/views/'));


//app.set('trust proxy', 'loopback');
app.set('views', __dirname + '/app/views');
app.set('view engine', 'ejs');

//Passport setup
var passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy;

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});
passport.use(new FacebookStrategy({
        clientID: pass_config.facebook.clientID,
        clientSecret: pass_config.facebook.clientSecret,
        callbackURL: pass_config.facebook.callbackURL,
        profileFields: pass_config.facebook.profileFields
    },
    function (accessToken, refreshToken, profile, done) {
        var pid = profile.id;

        //Users database
        mongo.connect(databases.usersURL, function (err, db) {
            if (err) {
                console.log("Cant connect");
            }
            var col = db.collection('users');
            col.find({
                id: pid
            }).toArray(function (err, ress) {
                if (ress.length == 0) {
                    console.log("No User");
                    var user = {
                        id: profile.id,
                        name: profile.displayName,
                        email: 'email',
                        lastSeen: 'new',
                        serverTimeAhead: 0,
                        rests: [],
                        restTimes: []
                    };
                    col.insert(user);
                    console.log("inserted This");
                    console.log(user);

                    done(null, user);
                } else {
                    console.log("Exists");
                    console.log(ress[0]);
                    done(null, ress[0]);
                }
            });
        });
    }
));
app.get('/login', passport.authenticate('facebook'));
app.get('/auth/callback', passport.authenticate('facebook', {
    scope: 'email',
    successRedirect: '/#!/res',
    failureRedirect: '/login'
}));

//Main database
mongo.connect(databases.dbURL, function (err, db) {
    if (err) {
        console.log(err);
    }
    var col = db.collection('votes');

    //Getting views through routers
    app.get('/query', query_router(request));
    app.get('/', main_router());
    app.get('/404', function (req, res) {
        if (req.user) {
            res.render('404', {
                user: req.user
            });
        } else {
            res.render('404', {
                user: 'none'
            });
        }
    });
    app.get('/isLogged', function (req, res) {

        if (req.user) {

            res.jsonp({
                state: 'authorized'
            });

        } else {
            res.jsonp({
                state: 'unauthorized'
            });
        }
    });
    app.get('/isGoing', function (req, res) {
        var time = req.query.time;
        console.log('TTTTTTTTTTTTTT: ' + time);
        mongo.connect(databases.usersURL, function (err, db) {

            var rest = req.query.name;

            if (err) {
                console.log('error in connecting to users db');
            } else {
                var col = db.collection('users');
                col.find({
                    id: req.user.id
                }).toArray(function (err, ress) {
                    console.log('connected to users collection');

                    console.log('Time from user: ' + time);
                    c('Server time: ' + Date.now());
                    var lastSeen = req.user.lastSeen;
                    var ret = req.user;

                    if (lastSeen == 'new') {
                        c('new user... Modifying lastSeen...');
                        ret.lastSeen = time;
                        ress[0].lastSeen = time;

                        ret.serverTimeAhead = Math.abs(Date.now() - time);
                        ress[0].serverTimeAhead = Math.abs(Date.now() - time);

                        //c('SSSSS: ' + new Date().getSeconds());
                        delete ret['_id'];
                        col.update({
                            id: req.user.id
                        }, ret);
                    } else {



                        ret.lastSeen = time;
                        ress[0].lastSeen = time;
                        delete ret['_id'];
                        col.update({
                            id: req.user.id
                        }, ret);
                        c('Not new user... LastSeen is: ' + ress[0].lastSeen);
                        //c('SSSSS: ' + new Date().getSeconds());


                        /*if (diff > 60000) {
    c('Clearing all rests...');
    ress[0].rests = [];
    var ret = ress[0];
    delete ress[0]['_id'];
    col.update({
        id: ret.id
    }, ret);
}*/

                    }


                    console.log('Current user profile is...:');
                    console.log(ress[0]);


                    if (ress[0].rests.indexOf(rest) < 0) {


                        console.log('No entry of rests in users');
                        res.jsonp({
                            isGoing: false
                        });
                        //Update users db
                        var ret = ress[0];
                        delete ret['_id'];
                        var insertion = {};
                        insertion[rest] = req.user.lastSeen;
                        ret.restTimes.push(insertion);
                        ret.rests.push(rest);
                        col.update({
                            id: req.user.id
                        }, ret);
                        console.log('inserted the rest to users col');
                        console.log(ret);

                        //Update main db
                        mongo.connect(databases.dbURL, function (err, db) {
                            var col = db.collection('data');
                            var query = {};
                            var obj2 = {};
                            obj2['$exists'] = true;
                            query[rest] = obj2;
                            col.find(query).toArray(function (err, ress) {
                                var ret = ress[0];
                                delete ret['id'];
                                var val = ret[rest] + 1;
                                ret[rest] = val;
                                col.update(query, ret);
                            });
                        });
                        db.close();
                    } else {
                        console.log('user has already marked as going. Removing entry');
                        res.jsonp({
                            isGoing: true
                        });

                        //update users db
                        var ret_ar = [];
                        var ret_times = [];
                        for (var i = 0; i < ress[0].rests.length; i++) {
                            if (ress[0].rests[i] != rest) {
                                ret_ar.push(ress[0].rests[i]);

                            }
                            if (Object.keys(ress[0].restTimes[i])[0] != rest) {
                                ret_times.push(ress[0].restTimes[i]);
                            }
                        }
                        var ret = ress[0];
                        delete ret['_id'];
                        ret.rests = ret_ar;
                        ret.restTimes = ret_times;
                        col.update({
                            id: req.user.id
                        }, ret);
                        console.log('removed the rest from users col');
                        console.log(ret);

                        //Update main db
                        mongo.connect(databases.dbURL, function (err, db) {
                            var col = db.collection('data');
                            var query = {};
                            var obj2 = {};
                            obj2['$exists'] = true;
                            query[rest] = obj2;
                            col.find(query).toArray(function (err, ress) {
                                var ret = ress[0];
                                delete ret['id'];
                                var val = ret[rest] - 1;
                                ret[rest] = val;
                                col.update(query, ret);
                            });
                        });
                        db.close();
                    }

                });


            }
        });
    });
    //app.get('/clean', cleaner());

});


//Listening
app.listen(process.env.PORT || 80);
