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
  security: {
    jwt: {
      access: {
        secret: getEnv("JWT_SECRET_TOKEN"),
        expiresIn: getEnv("JWT_SECRET_TOKEN_EXPIRES_IN", "1d"),
      },
      refresh: {
        secret: getEnv("JWT_REFRESH_TOKEN"),
        expiresIn: getEnv("JWT_REFRESH_TOKEN_EXPIRES_IN", "7d"),
      },
    },
  },
  api: {
    key: getEnv("API_KEY"),
    secret: getEnv("API_SECRET"),
  },
};
