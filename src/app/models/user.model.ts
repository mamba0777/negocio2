export interface User {
  id: number;
  email: string;
  name: string;
  password?: string;
  role?: string;
  avatar?: string;
  accessToken?: string;
  refreshToken?: string;
}
