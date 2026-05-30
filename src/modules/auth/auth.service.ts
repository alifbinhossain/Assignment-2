import bcrypt from 'bcryptjs';
import { pool } from '../../db';
import { USER_ROLE } from '../../types';
import type { IUser } from './auth.interface';

import jwt from 'jsonwebtoken';
import config from '../../config';

const createUser = async (payload: IUser) => {
  const { name, email, password, role } = payload;

  if (role && !Object.values(USER_ROLE).includes(role)) {
    throw new Error('User role must be contributor or maintainer');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
     INSERT INTO users(name,email,password,role) 
     VALUES($1,$2,$3,COALESCE($4,'contributor'))
     RETURNING *
        `,
    [name, email, hashedPassword, role],
  );

  return result;
};

const loginUser = async (payload: Pick<IUser, 'email' | 'password'>) => {
  const { email, password } = payload;

  // 1. CHECK IF USER PROVIDE EMAIL AND PASSWORD
  if (!email || !password) {
    throw new Error('Email and Password must be provided to login');
  }

  const result = await pool.query(
    `
    SELECT * FROM users
    WHERE email=$1
    `,
    [email],
  );

  const user = result.rows?.[0];

  // 2. CHECK IF USER EXISTS BY THE GIVEN EMAIL
  if (!user) {
    throw new Error('User not found');
  }

  const matchedPassword = await bcrypt.compare(password, user.password);

  // 3. CHECK IF THE GIVEN PASSWORD IS CORRECT
  if (!matchedPassword) {
    throw new Error('Invalid credentials');
  }

  // 4. GENERATE TOKEN
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  const token = jwt.sign(jwtPayload, config.secret, {
    expiresIn: config.secret_expiry,
  });

  // 5. REMOVE PASSWORD
  delete user.password;

  return { token, user };
};

export const authService = {
  createUser,
  loginUser,
};
