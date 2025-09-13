import axios from 'axios';
import httpStatus from 'http-status';
import { AppError } from '../../errors/AppError';
import { config } from '../../config';

// ML service health check
const checkMLServiceHealth = async () => {
  try {
    const response = await axios.get(`${config.ml.ml_service_url}/health`, {
      timeout: 5000
    });
    return {
      isHealthy: true,
      status: response.data.status,
      timestamp: response.data.timestamp
    };
  } catch (error) {
    return {
      isHealthy: false,
      error: 'ML service not available',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Send image URL to ML service for prediction
const predictDiseaseFromImageUrl = async (imageUrl: string, imageId: string, userId: string) => {
  try {
    // First check if ML service is healthy
    const healthCheck = await checkMLServiceHealth();
    if (!healthCheck.isHealthy) {
      throw new AppError(
        httpStatus.SERVICE_UNAVAILABLE,
        'ML prediction service is currently unavailable'
      );
    }

    // Download image from Cloudinary URL
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });

    // Create form data to send to ML service
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('image', imageResponse.data, {
      filename: `image_${imageId}.jpg`,
      contentType: 'image/jpeg'
    });

    // Send to Python ML service
    const mlResponse = await axios.post(
      `${config.ml.ml_service_url}/predict`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: parseInt(config.ml.ml_timeout),
      }
    );

    if (!mlResponse.data.success) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'ML prediction failed'
      );
    }

    return {
      success: true,
      prediction: mlResponse.data.prediction,
      treatment: mlResponse.data.treatment,
      processingTime: mlResponse.data.processing_time_seconds,
      imageInfo: mlResponse.data.image_info,
      timestamp: mlResponse.data.timestamp
    };

  } catch (error) {
    console.error('ML Service Error:', error);
    
    if (error instanceof AppError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        throw new AppError(
          httpStatus.SERVICE_UNAVAILABLE,
          'ML prediction service is not running'
        );
      }
      
      if (error.code === 'ETIMEDOUT') {
        throw new AppError(
          httpStatus.REQUEST_TIMEOUT,
          'ML prediction service timeout'
        );
      }
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to get disease prediction'
    );
  }
};

// Get ML service information
const getMLServiceInfo = async () => {
  try {
    const [healthResponse, modelResponse] = await Promise.all([
      axios.get(`${config.ml.ml_service_url}/health`, { timeout: 5000 }),
      axios.get(`${config.ml.ml_service_url}/models/info`, { timeout: 5000 })
    ]);

    return {
      health: healthResponse.data,
      models: modelResponse.data,
      serviceUrl: config.ml.ml_service_url
    };
  } catch (error) {
    return {
      error: 'ML service information unavailable',
      serviceUrl: config.ml.ml_service_url
    };
  }
};

// Batch prediction for multiple images (future use)
const batchPredict = async (imageUrls: Array<{id: string, url: string}>, userId: string) => {
  try {
    const predictions = await Promise.allSettled(
      imageUrls.map(img => 
        predictDiseaseFromImageUrl(img.url, img.id, userId)
      )
    );

    const results = predictions.map((result, index) => ({
      imageId: imageUrls[index].id,
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));

    return {
      success: true,
      total: imageUrls.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results
    };
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Batch prediction failed'
    );
  }
};

export const MLService = {
  checkMLServiceHealth,
  predictDiseaseFromImageUrl,
  getMLServiceInfo,
  batchPredict,
};