import { Response } from 'express';

interface ResponseData<T = any> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errorMessages?: Array<{
    path: string;
    message: string;
  }>;
}

export const sendResponse = <T>(res: Response, data: ResponseData<T>) => {
  return res.status(data.statusCode).json({
    success: data.success,
    statusCode: data.statusCode,
    message: data.message,
    data: data.data || null,
    meta: data.meta || null,
    errorMessages: data.errorMessages || null,
  });
};