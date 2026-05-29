import type { Response } from 'express';
import type { IResponse } from '../types';

export const sendResponse = <T>(res: Response, data: IResponse<T>): void => {
  const responseData: Omit<IResponse<T>, 'statusCode'> = {
    success: data.success,
    message: data.message,
    ...(data.data !== undefined ? { data: data.data } : {}),
    ...(data.errors !== undefined ? { errors: data.errors } : {}),
  };

  res.status(data.statusCode).json(responseData);
};

export const serverError = (res: Response, errors: any) => {
  return sendResponse(res, {
    statusCode: 500,
    success: false,
    message: errors.message,
    errors,
  });
};
