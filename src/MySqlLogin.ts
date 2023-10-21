import { Connection, createConnection } from 'mysql';

import { ILogin, OnLoginCallback } from './ILogin';

import md5 = require('md5');
import { Config } from './Config';

export class MySqlLogin implements ILogin {
  private static sInstance: MySqlLogin | null = null;

  private mPrivKeySalt: string;
  private mHashSalt: string;
  private mConnection: Connection;

  private constructor() {
    this.mConnection = createConnection({
      host: Config.DATABASE_HOST,
      user: Config.DATABASE_USER,
      password: Config.DATABASE_PASSWORD,
      database: Config.DATABASE_NAME,
    });
    this.mConnection.connect();

    this.mPrivKeySalt = 'qwelkjfqwe';
    this.mHashSalt = 'qwe1feef';
  }

  public static getInstance(): MySqlLogin {
    if (this.sInstance === null) {
      this.sInstance = new MySqlLogin();
    }
    return this.sInstance;
  }

  public login(id: string, pw: string, callback: OnLoginCallback): void {
    const query =
      'SELECT private_key FROM user WHERE id = ? AND pw = ? AND confirm = 1';
    this.mConnection.query(
      query,
      [id, md5(pw)],
      (err, rows: Array<{ private_key: string }>) => {
        if (err || !rows) {
          console.log('login failed: db error');
          callback(null);
        } else if (rows.length === 0 || !rows[0].private_key) {
          console.log('login failed: no matched');
          callback(null);
        } else {
          console.log('login success');
          callback(rows[0].private_key);
        }
      }
    );
  }

  public join(
    id: string,
    pw: string,
    nickname: string,
    callback: (result: boolean) => void
  ): void {
    const privKey = md5(this.mPrivKeySalt + new Date().getTime());
    const hash = md5(this.mHashSalt + new Date().getTime());
    const query =
      'INSERT INTO user (private_key, hash, id, pw, nickname) VALUES (?, ?, ?, MD5(?), ?)';
    this.mConnection.query(
      query,
      [privKey, hash, id, pw, nickname],
      (err, data) => {
        if (err) {
          console.error(err);
          callback(false);
          return;
        }
        if (!data || data.affectedRows != 1) {
          console.error(data);
          callback(false);
          return;
        }
        callback(true);
      }
    );
  }
}
