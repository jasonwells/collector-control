var express = require('express');
var bodyParser = require('body-parser');
var redis = require('redis');
var basicAuth = require('basic-auth');
var settings = require('./config/settings');

// Setup express
var app = express();
app.use(bodyParser.json());
app.use(function (error, req, res, next) {
  if (error instanceof SyntaxError) {
    res.status(400);
    res.json({ error: 'Invalid JSON object' });
    console.log('ERROR: %s - Error parsing JSON body', req.originalUrl);
  } else {
    next();
  }
});

// Setup redis connection
var redisClient = redis.createClient(settings.redis.url);

// Setup authentication
var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
  }

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  }

  if (user.name === settings.auth.username && user.pass === settings.auth.password) {
    return next();
  } else {
    return unauthorized(res);
  }
};

// Status endpoint
app.get('/', function(req, res) {
  res.json({ status: 'up' });
});

// Send request to queue here
app.post('/enqueue', auth, function(req, res) {
  var job = {
    class : settings.redis.class
  };
  if (req.body && req.body.constructor === Array) {
    job.args = req.body;
    var success = redisClient.rpush(settings.redis.queue, JSON.stringify(job));
    if (success === true) {
      res.sendStatus(204);
    }
    else {
      res.sendStatus(500);
    }
  }
  else {
    res.status(400);
    res.json({ error: 'Body submitted must be array of arguments' });
    console.log('ERROR: %s - Body submitted not an array of arguments', req.originalUrl);
  }
});

var server = app.listen(settings.server.port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('collector-control listening at http:://%s:%s', host, port);
});
