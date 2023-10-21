import { IStrategyOptions, Strategy as LocalStrategy } from 'passport-local';

import { ILogin } from './ILogin';
import { MySqlLogin } from './MySqlLogin';

export class VegaLoginStrategy extends LocalStrategy {
  private static readonly FIELD_USER_NAME = 'mcid';
  private static readonly FIELD_PASSWORD = 'mcpw';

  private mLogin: ILogin;

  public constructor() {
    const opt: IStrategyOptions = {
      usernameField: VegaLoginStrategy.FIELD_USER_NAME,
      passwordField: VegaLoginStrategy.FIELD_PASSWORD,
      session: true,
    };

    super(opt, (id, pw, done) => {
      const failed = (msg: string) => done({ message: msg }, undefined);
      const success = (user: any) => done(null, user);
      console.log(`try: id-${id}`);
      this.mLogin.login(id, pw, (result) => {
        if (!result) {
          return failed('Incorrect');
        }
        console.log(`success: id-${id}`);
        return success({ hash: result });
      });
    });

    this.mLogin = MySqlLogin.getInstance();
  }
}
