import type { Request, Response } from 'express';
import { sendResponse, serverError } from '../../utils/sendResponse';
import { authService } from './auth.service';

const signUp = async (req: Request, res: Response) => {
  try {
    const result = await authService.createUser(req.body);

    result.rows.forEach((_r) => delete _r.password);

    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'User registered successfully',
      data: result.rows[0],
    });
  } catch (error) {
    serverError(res, error);
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUser(req.body);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    serverError(res, error);
  }
};

export const authController = { signUp, login };
