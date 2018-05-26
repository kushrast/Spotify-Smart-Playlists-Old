
var express = require('express'); //loads express middleware
var cookieParser = require('cookie-parser'); //loads cookie parser library
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');

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

var router = express.Router();
app.use('/', router);

router.get('/', function(req, res, next) {
	res.render('index', {
		title: 'Node Tutorial'
	});
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