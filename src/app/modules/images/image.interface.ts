import { ProcessingStatus } from "../../../generated/prisma";


export interface IImageUpload {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string; // Will contain Cloudinary URL
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

export interface ICloudinaryUrls {
  urls: {
    original: string;
    processed: string;
    thumbnail: string;
  };
  transformedUrls: {
    small: string;   // w_300,h_200,c_fill
    medium: string;  // w_600,h_400,c_fill
    large: string;   // w_1200,h_800,c_fill
  };
}

export interface IImageResponse extends ICloudinaryUrls {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;           // Cloudinary original URL
  processedPath?: string; // Cloudinary processed URL
  thumbnailPath?: string; // Cloudinary thumbnail URL
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
  formattedTotalSize?: string;
  recentImages?: Array<{
    id: string;
    originalName: string;
    uploadedAt: Date;
    processingStatus: ProcessingStatus;
    urls?: {
      original: string;
      processed: string;
      thumbnail: string;
    };
  }>;
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

// Cloudinary specific interfaces
export interface ICloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  access_mode: string;
  original_filename: string;
}

export interface IImageProcessingOptions {
  resize?: {
    width: number;
    height: number;
    fit?: 'contain' | 'cover' | 'fill';
  };
  quality?: number;
  format?: 'auto' | 'jpg' | 'png' | 'webp';
  folder?: string;
}

// Frontend-ready image data
export interface IImageForFrontend extends ICloudinaryUrls {
  id: string;
  originalName: string;
  uploadedAt: Date;
  size: number;
  width?: number;
  height?: number;
  processingStatus: ProcessingStatus;
  
  // Prediction summary for quick display
  predictionSummary?: {
    hasPredictions: boolean;
    isHealthy?: boolean;
    diseaseName?: string;
    confidence?: number;
    severity?: string;
  };
  
  // File size formatted for display
  formattedSize: string;
  
  // Additional metadata
  aspectRatio?: number;
  uploadedBy: {
    id: string;
    name: string;
  };
}

// ML service integration interfaces
export interface IImageForML {
  id: string;
  processedUrl: string; // 512x512 Cloudinary URL
  originalUrl: string;
  metadata: {
    width?: number;
    height?: number;
    format: string;
    size: number;
  };
}

export interface IMLPredictionRequest {
  imageId: string;
  imageUrl: string;
  userId: string;
  modelVersion?: string;
}

export interface IMLPredictionResponse {
  success: boolean;
  prediction?: {
    isHealthy: boolean;
    disease?: string;
    confidence: number;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    affectedArea?: number;
    recommendations?: string[];
  };
  error?: string;
  processingTime?: number;
}