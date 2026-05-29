import type { USER_ROLE } from '../../types';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: USER_ROLE;
}
