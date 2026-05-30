import type { Request, Response, NextFunction } from 'express';

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err.stack); // Log the error

  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};
