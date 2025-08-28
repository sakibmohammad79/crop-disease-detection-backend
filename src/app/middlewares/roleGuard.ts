import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';
import status from 'http-status';

export const roleGuard = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendResponse(res, {
        statusCode: status.UNAUTHORIZED,
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendResponse(res, {
        statusCode: status.FORBIDDEN,
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};