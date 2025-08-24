import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';

export const roleGuard = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendResponse(res, {
        statusCode: 401,
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendResponse(res, {
        statusCode: 403,
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};