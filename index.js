const express = require('express');
const moment = require('moment');
const crypto = require('crypto');
const Gpio = require('onoff').Gpio;

const secret = process.env.SECRET || 'a1b2c3';
const LED = new Gpio(27, 'high');

const app = express();
const port = 3000

app.post('/trigger', auth, flash);

function auth(req, res, next) {
  const authHeader = (req.headers.authorization || '');
  const [timestamp, signature] = authHeader.split(':');

  if (validateAuthorization(timestamp, signature)) {
    return next();
  } else {
    res.status(401).send('Authentication required.');
  }
}

function flash(req, res) {
  flashLED();
  res.status(201).send();
}

const server = app.listen(port, () => console.log(`garage app listening on port ${port}`));

process.on('SIGINT', function() {
  console.log('stopping garage app');
  server.close();
  LED.unexport();
  process.exit();
});

async function flashLED() {
  LED.writeSync(0);
  await sleep(1000)
  LED.writeSync(1);
}

function sleep(time) {
  return new Promise((resolve, reject) => { setTimeout(resolve, time) })
}

function validateAuthorization(timestamp, signature) {
  const remoteTime = parseInt(timestamp);
  const localTime = moment().unix();

  const hmac = crypto.createHmac('sha1', secret).update(timestamp).digest('hex');
  
  return ((localTime - remoteTime < 5) && (hmac == signature));
}
