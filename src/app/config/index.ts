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
  api: {
    key: getEnv("API_KEY"),
    secret: getEnv("API_SECRET"),
  },
};
