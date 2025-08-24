import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { sendResponse } from '../utils/response';
import prisma from '../utils/prisma';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return sendResponse(res, {
        statusCode: 401,
        success: false,
        message: 'Access token is required',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // Check if user exists and is active
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!user) {
      return sendResponse(res, {
        statusCode: 401,
        success: false,
        message: 'User not found or inactive',
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Invalid or expired token',
    });
  }
};