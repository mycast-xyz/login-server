import bodyParser from 'body-parser';
import express from 'express';
import session from 'express-session';
import { readFileSync } from 'fs';
import http from 'http';
import https from 'https';
import passport from 'passport';
import sessionFileStore from 'session-file-store';

import { MySqlLogin } from './MySqlLogin';
import { VegaLoginStrategy } from './VegaLoginStrategy';
import { Config } from './Config';

const app = express();

const secretCode = Config.PASSPORT_SECRET_CODE;

const FileStore = sessionFileStore(session);
app.use((req, res, next) => {
  const whiteList = [
    'https://tauri.localhost',
    'http://localhost:4200',
    'http://localhost:5000',
    'http://mycast.xyz',
    'https://mycast.xyz',
    'https://test.mycast.xyz',
    'http://mycast.xyz:10080',
  ];
  const isWhiteList = (host: string) => whiteList.indexOf(host) > -1;
  const origin = req.headers.origin;
  console.log(origin);
  if (typeof origin === 'string' && isWhiteList(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: secretCode,
    resave: true,
    saveUninitialized: false,
    store: new FileStore(),
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: any, done) => {
  console.log('serializeUser');
  done(null, user.hash);
});

passport.deserializeUser((hash, done) => {
  console.log('deserializeUser');
  done(null, { hash });
});

passport.use(new VegaLoginStrategy());

app.get('/login', (req, res) => {
  const html = `
      <form action="/login" method="post">
        <p><input type="text" name="mcid" placeholder="email"></p>
        <p><input type="password" name="mcpw" placeholder="password"></p>
        <p>
          <input type="submit" value="login">
        </p>
      </form>`;
  res.send(html);
});

app.get('/failed', (req, res) => {
  res.statusCode = 400;
  res.send();
});

app.post('/join', (req, res) => {
  const { vgid, vgpw, vgnick } = req.body as {
    vgid: string;
    vgpw: string;
    vgnick: string;
  };

  const strMatch = (str: string, min: number = 4) =>
    vgid && vgid.length >= min && vgid.length <= 20;

  if (!strMatch(vgid) || !strMatch(vgpw) || !strMatch(vgnick, 0)) {
    console.error('request error');
    res.sendStatus(400);
    return;
  }

  MySqlLogin.getInstance().join(vgid, vgpw, vgnick, (result) => {
    if (result) {
      console.log(`join - ${vgid}`);
      res.send('success');
    } else {
      res.sendStatus(400);
    }
  });
});

app.post('/auth', passport.authenticate('local'), (req, res) => {
  if (!req || res.statusCode !== 200 || !req.session) {
    console.error('request error');
    res.sendStatus(400);
    return;
  }

  if (!req.session || !req.sessionID) {
    console.error('session not found');
    res.sendStatus(400);
    return;
  }
  try {
    console.log('login session', req.session, req.sessionID);
    const sid = req.sessionID;
    const hash = req.session.passport?.user;
    if (!hash) {
      console.log('500 - hash not founded', hash);
      res.sendStatus(500);
      return;
    }
    res.json({ result: true, sid, hash, message: 'login success' });
  } catch (e) {
    console.error('500 - internal Error', e);
    res.sendStatus(500);
  }
});

app.delete('/auth', (req, res) => {
  console.log('logout try');
  req.logout(() => {});
  if (!req.session) {
    res.json({
      result: false,
      message: 'logout failed',
    });
    return;
  }

  console.log('logout session', req.session);

  req.session.save(() => {
    res.json({
      result: true,
      message: 'logout success',
    });
  });
});

app.get('/logout', (req, res) => {
  console.log('logout try');
  req.logout(() => {});
  if (!req.session) {
    res.json({
      result: false,
      message: 'logout failed',
    });
    return;
  }

  console.log('logout session', req.session);

  req.session.save(() => {
    res.json({
      result: true,
      message: 'logout success',
    });
  });
});

http.createServer(app).listen(3000, () => {
  console.log('Login app listening on port 3000');
});

const keyPath: string = '/etc/letsencrypt/live/mycast.xyz/privkey.pem';
const certPath: string = '/etc/letsencrypt/live/mycast.xyz/cert.pem';
const caPath: string = '/etc/letsencrypt/live/mycast.xyz/fullchain.pem';
const key = readFileSync(keyPath);
const cert = readFileSync(certPath);
const ca = readFileSync(caPath);
https.createServer({ key, cert, ca }, app).listen(3001, () => {
  console.log('Login app(ssl) listening on port 3001');
});
