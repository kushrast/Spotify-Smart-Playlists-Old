
var express = require('express'); //loads express middleware
var cookieParser = require('cookie-parser'); //loads cookie parser library
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var querystring = require('querystring')
var bodyParser = require('body-parser');
var request = require('request');
var session = require('express-session');

var app = express();

app.set('views', path.join(__dirname, 'views')) //lets system know views are in /views
app.set('view engine', 'hbs'); //sets handlebars as the view system

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'yay area', cookie: { maxAge: 60000}}))

var client_id = '0a5c5df0c91e48ab9da23fc2facc3c40'; // Your client id
var client_secret = 'bc3359f757a14b49b5740cf643b1b632'; // Your secret
var redirect_uri = 'https://spotify-sessions-kush.herokuapp.com/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var router = express.Router();
app.use('/', router);

router.get('/', function(req, res, next) {
	if (req.session.access_token) {
		res.redirect('/main');
	} else {
		res.redirect('/login'); //incorporate session data soon
	}
});

router.get('/login', function(req, res, next) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative user-modify-playback-state';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

router.get('/callback', function(req, res, next) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        req.session.access_token = access_token;
        req.session.refresh_token = refresh_token;
        res.redirect('/main');
      } else {
        res.redirect('/invalid');
      }
    });
  }
});

router.get('/main', function(req, res, next) {
	var access_token = req.session.access_token;
	var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, profile) {
        	var options = {
	          url: 'https://api.spotify.com/v1/me/playlists',
	          headers: { 'Authorization': 'Bearer ' + access_token },
	          json: true
	        };

	        // use the access token to access the Spotify Web API
	        request.get(options, function(error, response, playlists) {
        		res.render('main', {'profile':profile, 'playlists':playlists});
        	});
        });
})

router.get('/playlists/', function(req, res, next) {
	console.log(req.session);
	if (!req.session.access_token) {
		res.redirect("/invalid");
	} else {
		var uri = req.query.uri.split(":");
		var options = {
          url: 'https://api.spotify.com/v1/users/'+uri[2]+'/playlists/'+uri[4]+'/tracks',
          headers: { 'Authorization': 'Bearer ' + req.session.access_token },
          json: true
        };

        console.log(options);

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, playlist) {
        	data = {
        		'tracks': playlist,
        		'access_token': req.session.access_token
        	}
			res.render('playlists', data);
		});
	}
});

router.post('/', function(req, res, next) {
	var body = req.body;

	var res_body = {
		first_name: body.first_name,
		last_name: body.last_name,
		email: body.email
	};

	res.render('welcome', res_body);
})

router.get('/invalid', function(req, res, next) {
	res.render('invalid');
})

app.post('/play_current', function(req, res) {
	var body = JSON.parse(req.body);
	var options = {
      url: 'https://api.spotify.com/v1/me/player/play',
      headers: { 'Authorization': 'Bearer ' + body.access },
      data: JSON.stringify({
      	'uris': body.uris
      }),
      json: true
    };

    console.log(options);
    console.log(req.body);

    // use the access token to access the Spotify Web API
    request.get(options, function(error, response, playlist) {
    	console.log(error)
	});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

console.log('Listening on PORT');
app.listen(process.env.PORT);