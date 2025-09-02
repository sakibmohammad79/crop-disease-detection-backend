import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";


export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error Details:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = {};

  // Handle custom AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
    
  // Handle Prisma errors
  else if (err.code && err.code.startsWith('P')) {
    statusCode = 400;
    switch (err.code) {
      case 'P2002':
        message = 'Duplicate entry found';
        details.field = err.meta?.target;
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        message = 'Foreign key constraint failed';
        break;
      case 'P2014':
        message = 'Invalid ID provided';
        break;
      default:
        message = 'Database operation failed';
    }
  }
    
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again';
  }
    
  // Handle Multer errors (file upload)
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
  }
  else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Too many files uploaded';
  }
    
  // Handle SyntaxError (malformed JSON)
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON format';
  }

  // Prepare response
  const errorResponse: any = {
    success: false,
    statusCode,
    message,
    timestamp: new Date().toISOString(),
  };

  // Add details in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = err.name;
    errorResponse.stack = err.stack;
    if (Object.keys(details).length > 0) {
      errorResponse.details = details;
    }
  }

  // Add details for validation errors even in production
  if (statusCode === 400 && Object.keys(details).length > 0) {
    errorResponse.details = details;
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper utility
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};