import { ProcessingStatus } from "../../../generated/prisma";


export interface IImageUpload {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  userId: string;
}

export interface IImageQuery {
  page?: number;
  limit?: number;
  sortBy?: 'uploadedAt' | 'originalName' | 'size';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  userId?: string;
  processingStatus?: ProcessingStatus;
}

export interface IImageResponse {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  processedPath?: string;
  thumbnailPath?: string;
  uploadedAt: Date;
  width?: number;
  height?: number;
  gpsLatitude?: number;
  gpsLongitude?: number;
  capturedAt?: Date;
  processingStatus: ProcessingStatus;
  processingError?: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  predictions?: Array<{
    id: string;
    confidence: number;
    isHealthy: boolean;
    createdAt: Date;
    disease?: {
      id: string;
      name: string;
      severity: string;
    };
  }>;
}

export interface IImageStats {
  totalImages: number;
  processingStats: Array<{
    processingStatus: ProcessingStatus;
    _count: number;
  }>;
  totalSize: number;
  averageSize: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}