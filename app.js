/**
 * Module dependencies.
 */

var express = require('express'),
    http = require('http'),
    path = require('path'),
    consolidate = require('consolidate'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passport = passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    twitter = require('ntwitter'),
    Chance = require('chance'),
    config = require("./config/oauth.js"),
    services = require("./config/services.js");

// Instantiate Chance so it can be used
var chance = new Chance();

//Create User Schema
var UserSchema = new Schema({
    provider: String,
    uid: String,
    name: String,
    image: String,
    accessTokenKey: String,
    accessTokenSecret: String,
    created: {
        type: Date,
        default: Date.now
    }
});


mongoose.model('User', UserSchema);

var User = mongoose.model('User');


passport.use(new TwitterStrategy({
        consumerKey: config.twitter.clientID,
        consumerSecret: config.twitter.clientSecret,
        callbackURL: config.twitter.callbackURL
    },
    function (token, tokenSecret, profile, done) {
        User.findOne({
            uid: profile.id
        }, function (err, user) {
            if (user) {
                done(null, user);
            } else {
                var user = new User();

                user.provider = "twitter";
                user.uid = profile.id;
                user.name = profile.displayName;
                user.image = profile._json.profile_image_url;
                
                user.started = false;
                
                user.accessTokenKey = token;
                user.accessTokenSecret = tokenSecret;

                user.save(function (err) {
                    if (err) {
                        throw err;
                    }
                    done(null, user);
                });
            }
        })
    }
));


passport.serializeUser(function (user, done) {
    done(null, user.uid);
});

passport.deserializeUser(function (uid, done) {
    User.findOne({
        uid: uid
    }, function (err, user) {
        done(err, user);
    });
});

var app = express();

// configure Express
app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.engine('html', consolidate.handlebars);
    app.set('view engine', 'html');
    
    app.use(express.favicon(path.join(__dirname, '/public/images/favicon.ico'))); 

    
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());

    app.use(express.cookieParser());
    app.use(express.session({
        secret: 'keyboard cat'
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 

    // Connect mongoose
    mongoose.connect(services.mongodb.dev);
});

app.configure('production', function(){
    app.use(express.errorHandler()); 
    
    // Connect mongoose
    mongoose.connect(services.mongodb.prod);
});

/////ROUTES

//Index
app.get('/', function (req, res) {
    res.render('index', {
        title: 'Tweet Bot',
        user: req.user
    });
});


//Logout
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});


// Redirect the user to Twitter for authentication.  When complete, Twitter
// will redirect the user back to the application at /auth/twitter/callback
app.get('/auth/twitter', passport.authenticate('twitter'));

// Twitter will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
        successRedirect: '/',
        failureRedirect: '/login'
    }));


var twitArray = {};

var tweet = "MESSAGE HERE ";

//API
app.post('/send/tweet', function (req, res) {
    var uid = req.user.uid;
    var key = req.user.accessTokenKey;
    var secret = req.user.accessTokenSecret;

    //Creating twit object
    var twit = createTwit(uid, key, secret);

    //Sending tweet
    var tweet = randomizeTweet();

    twit.updateStatus(tweet,
            function (err, data) {
                if (err) {
                    res.send(500, err);
                } else {
                    res.send(200);
                }
               // console.log(data);
            }
    );

});

function createTwit(uid, key, secret){
    var twit;
    
    if (uid in twitArray) {
        twit = twitArray[uid];
        console.log('User already in array - ID: ' + uid);
    } else {
        twit = new twitter({
            consumer_key: config.twitter.clientID,
            consumer_secret: config.twitter.clientSecret,
            access_token_key: key,
            access_token_secret: secret
        });

        twitArray[uid] = twit;

        console.log('Adding user to array - ID: ' + uid);
    }
    
    return twit;
}

function randomizeTweet(){
    var myRandomString = chance.hash({
        length: 18
    });

    var randomizedTweet = tweet + myRandomString;
    
    console.log('Tweet Length: ' + randomizedTweet.length);
    
    return randomizedTweet;
}

//API
app.get('/search/tweet', function (req, res) {
    var uid = req.user.uid;
    var key = req.user.accessTokenKey;
    var secret = req.user.accessTokenSecret;

    //Creating twit object
    var twit = createTwit(uid, key, secret);
    
    var hashtag = '#hastag'

    twit.search('@' + req.user.id + ' AND ' + hashtag, {},
            function (err, data) {
                if (err) {
                    res.send(500, err);
                } else {
                    res.render('search', {
                        title: 'Tweet Bot',
                        user: req.user,
                        data: data
                    });
                }
               // console.log(data);
            }
    );

});




var server = http.createServer(app);

//Start server
server.listen(app.get('port'), function () {
    console.log("Express server listening on %s:%d in %s mode", '127.0.0.1', app.get('port'), app.settings.env);
});


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
    console.log('redirecting to homepage');
}
