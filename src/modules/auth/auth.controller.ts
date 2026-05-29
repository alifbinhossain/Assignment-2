import type { Request, Response } from 'express';
import { sendResponse, serverError } from '../../utils/sendResponse';

const signUp = async (req: Request, res: Response) => {
  try {
    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'User registered successfully',
      data: {},
    });
  } catch (error) {
    serverError(res, error);
  }
};

const login = async (req: Request, res: Response) => {
  try {
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Login successful',
      data: {},
    });
  } catch (error) {
    serverError(res, error);
  }
};

export const authController = { signUp, login };
