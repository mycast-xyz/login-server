export interface ILogin {
  login(id: string, pw: string, callback: OnLoginCallback): void;
}

export type OnLoginCallback = (result: any | null) => void;
