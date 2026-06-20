export interface User {
  username: string;
  hashed_password?: string;
  id?: number;
  password?: string;
}

export interface LoginResponse {
  session_key: string;
}

export enum SessionAuthenticationResult {
  unknown,
  valid_session,
  expired_session,
  invalid_session,
}

export interface Status {
  session_status: SessionAuthenticationResult;
  logged_in: boolean;
  username?: string;
}
