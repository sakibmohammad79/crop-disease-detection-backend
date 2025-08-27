import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { sendResponse } from '../utils/response';
import prisma from '../utils/prisma';
import status from 'http-status';
import { STATUS_CODES } from 'http';
import { config } from '../config';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}


export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const token = req.headers.authorization;
    if (!token) {
      return sendResponse(res, {
        statusCode: status.UNAUTHORIZED,
        success: false,
        message: 'Access token is required',
      });
    }

    const decoded = jwt.verify(token, config.jwt.access_token_secret!) as JwtPayload;
    
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
        statusCode: status.UNAUTHORIZED,
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
      statusCode: status.UNAUTHORIZED,
      success: false,
      message: 'Invalid or expired token',
    });
  }
};