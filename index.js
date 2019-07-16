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


app.get('/stream', (req, res) => {
	res.sendFile(__dirname + '/stream.html');
});

app.post('/stream', (req, res) => {
  res.send({"status": 200});
});

app.use('/assets', express.static('assets'));

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
  res.sendFile(__dirname + '/index.html');
});

// All Hoosuite apps require HTTPS, so in order to host locally
// you must have some certs. They don't need to be issued by a CA for development,
// but for production they definitely do! Heroku adds its own TLS,
// so you don't have to worry about it as long as TLS is enabled on your Heroku app.
if (fs.existsSync('certs/server.crt') && fs.existsSync('certs/server.key')) {
  const certificate = fs.readFileSync('certs/server.crt').toString();
  const privateKey = fs.readFileSync('certs/server.key').toString();
  const options = {key: privateKey, cert: certificate};

  var server = https.createServer(options, app).listen(process.env.PORT || 5000);
  console.log(`App listening on port ${process.env.PORT || 5000} using HTTPS`);
} else {
  var server = http.createServer(app).listen(process.env.PORT || 5000);
  console.log(`App listening on port ${process.env.PORT || 5000}`);
}

const io = require('socket.io')(server);

io.on('connection', function (socket) {
  socket.on('refresh', function(data) {
    console.log('Refresh received on server', data);
  });
});
