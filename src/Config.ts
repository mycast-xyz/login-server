import * as dotenv from 'dotenv';

dotenv.config();

export class Config {
  public static readonly DATABASE_NAME: string = process.env.DB_NAME || '';

  public static readonly DATABASE_HOST: string =
    process.env.DB_HOST || 'localhost';

  public static readonly DATABASE_USER: string = process.env.DB_USER || '';

  public static readonly DATABASE_PASSWORD: string =
    process.env.DB_PASSWORD || '';

  static readonly PASSPORT_SECRET_CODE: string =
    process.env.PASSPORT_SECRET_CODE ?? 'secretcode';
}
