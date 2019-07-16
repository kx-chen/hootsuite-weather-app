'use strict';
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();

// create application/json parser
const jsonParser = bodyParser.json();
// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: true });

app.use(jsonParser);
app.use(urlencodedParser);
app.set('view engine', 'ejs');


app.get('/stream', (req, res) => {
	res.sendFile(__dirname + '/views/stream.html');
});

app.post('/stream', (req, res) => {
  res.sendFile(__dirname + '/views/stream.html');
});

app.get('/weather/:lat/:lng', (req, res) => {
  res.render('widget.ejs', {
    "lat": req.params.lat,
    "lng": req.params.lng,
  });
});

app.use('/js', express.static('js'));

app.post('/webhooks', (req, res) => {
  console.log("Webhook content:\n\n%s", JSON.stringify(req.body));
  res.status(200).end();
});

//used for webhooks with urlencoded payloads
app.post('/callbacks', (req, res) => {
  console.log("Callback content");
  console.log(req.body);

  res.status(200).send('{"success":true}').end();
});


app.get('/', (req, res) => {
  res.redirect('/stream');
});

// All Hoosuite apps require HTTPS, so in order to host locally
// you must have some certs. They don't need to be issued by a CA for development,
// but for production they definitely do! Heroku adds its own TLS,
// so you don't have to worry about it as long as TLS is enabled on your Heroku app.
if (fs.existsSync('certs/server.crt') && fs.existsSync('certs/server.key')) {
  const certificate = fs.readFileSync('certs/server.crt').toString();
  const privateKey = fs.readFileSync('certs/server.key').toString();
  const options = {key: privateKey, cert: certificate};

  let server = https.createServer(options, app).listen(process.env.PORT || 5000);
  console.log(`App listening on port ${process.env.PORT || 5000} using HTTPS`);
} else {
  let server = http.createServer(app).listen(process.env.PORT || 5000);
  console.log(`App listening on port ${process.env.PORT || 5000}`);
}

