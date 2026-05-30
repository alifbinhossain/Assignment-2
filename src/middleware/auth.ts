import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import config from '../config';
import { pool } from '../db';
import type { IUser } from '../modules/auth/auth.interface';
import type { USER_ROLE } from '../types';
import { sendResponse } from '../utils/sendResponse';

export const AUTH_ERRORS = {
  EMPTY_TOKEN: {
    success: false,
    statusCode: 401,
    message: 'Authorization token is required.',
  },

  INVALID_TOKEN: {
    success: false,
    statusCode: 401,
    message: 'Invalid or expired authorization token.',
  },

  INVALID_USER: {
    success: false,
    statusCode: 404,
    message: 'User does not exist.',
  },

  ROLE_NOT_ALLOWED: {
    success: false,
    statusCode: 403,
    message: 'You are not authorized to perform this action.',
  },
};

const authMiddleware = (...roles: USER_ROLE[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      // CHECK IF TOKEN EXISTS
      if (!token) {
        return sendResponse(res, AUTH_ERRORS['EMPTY_TOKEN']);
      }
      // DECODE THE TOKEN AND VERIFY
      const decodedToken = jwt.verify(token, config.secret) as JwtPayload;

      const result = await pool.query(
        `
        SELECT * FROM users
        WHERE id=$1
        `,
        [decodedToken.id],
      );

      // CHECK IF THE USER EXISTS FROM DB
      if (result.rows.length === 0) {
        return sendResponse(res, AUTH_ERRORS['INVALID_USER']);
      }

      const user: IUser = result.rows[0];

      // CHECK IF THE USER HAS ALLOWED TO THIS RESOURCES BASED ON THE ROLE
      if (roles.length && !roles.includes(user.role)) {
        return sendResponse(res, AUTH_ERRORS['ROLE_NOT_ALLOWED']);
      }

      req.user = decodedToken;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authMiddleware;
