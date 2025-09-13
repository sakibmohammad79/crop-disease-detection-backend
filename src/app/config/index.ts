import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(`❌ Missing required env variable: ${key}`);
  }
  return value;
}

function getEnvArray(key: string, fallback?: string): string[] {
  const value = getEnv(key, fallback);
  return value.split(",").map(v => v.trim());
}

export const config = {
  app: {
    nodeEnv: getEnv("NODE_ENV", "development"),
    port: Number(getEnv("PORT", "3000")),
  },
  database: {
    url: getEnv("DATABASE_URL"),
  },
  cors: {
    allowedOrigins: getEnvArray("ALLOWED_ORIGINS", "http://localhost:3000"),
  },
  jwt: {
    access_token_secret: getEnv("ACCESS_TOKEN_SECRET"),
    access_token_secret_expires_in: getEnv("ACCESS_TOKEN_SECRET_EXPIRES_IN"),
    refresh_token_secret: getEnv("REFRESH_TOKEN_SECRET"),
    refresh_token_secret_expires_in: getEnv("REFRESH_TOKEN_SECRET_EXPIRES_IN"),
  },
  password: {
    reset_password_link: getEnv("RESET_PASSWORD_LINK"),
    reset_password_token_secret: getEnv("RESET_PASSWORD_TOKEN_SECRET"),
    reset_password_token_exp_in: getEnv("RESET_PASSWORD_EXPIRES_IN")
  },
  emailSender: {
    smtp_user: getEnv("SMTP_USER"),
    smtp_user_pass: getEnv("SMTP_PASSWORD"),
    smtp_hos: getEnv("SMTP_HOST"),
    smtp_port: getEnv("SMTP_PORT"),
    email_from: getEnv("EMAIL_FROM"),
    email_from_name : getEnv("EMAIL_FROM_NAME")
  },
  cloudinary: {
    cloudinary_cloud_name : getEnv("CLOUDINARY_CLOUD_NAME"),
    cloudinary_api_kay : getEnv("CLOUDINARY_API_KEY"),
    CLOUDINARY_API_SECRET: getEnv("CLOUDINARY_API_SECRET"),
  },
  ml: {
    ml_service_url: getEnv("ML_SERVICE_URL"),
    ml_timeout: getEnv("ML_TIMEOUT"),
  }
};
