import { config } from "dotenv";

// Load environment variables from the specified .env file
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
config({ path: envFile });

// Server configuration
export const SERVER_CONFIG = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV || 'development',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
  BASE_URL: process.env.BASE_URL,
};

// JWT configuration
export const JWT_CONFIG = {
  ACCESS_TOKEN: {
    SECRET: process.env.JWT_ACCESS_TOKEN_SECRET,
    EXPIRES_IN: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
  },
  REFRESH_TOKEN: {
    SECRET: process.env.JWT_REFRESH_TOKEN_SECRET,
    EXPIRES_IN: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  ALGORITHM: process.env.JWT_ALGORITHM || 'HS256',
  TOKEN_TYPE: process.env.JWT_TOKEN_TYPE || 'Bearer',
  TOKEN_PREFIX: process.env.JWT_TOKEN_PREFIX || 'Bearer',
  TOKEN_HEADER: process.env.JWT_TOKEN_HEADER || 'Authorization',
};

// Database configuration - adding this as it's commonly needed
export const DB_CONFIG = {
  HOST: process.env.DB_HOST,
  PORT: process.env.DB_PORT,
  USERNAME: process.env.DB_USERNAME,
  PASSWORD: process.env.DB_PASSWORD,
  DATABASE: process.env.DB_DATABASE,
  DIALECT: process.env.DB_DIALECT || 'postgres',
};

// Optional: Add defaults and validation
export const validateConfig = () => {
  const requiredVars = [
    { key: 'JWT_ACCESS_TOKEN_SECRET', config: JWT_CONFIG.ACCESS_TOKEN.SECRET },
    { key: 'JWT_REFRESH_TOKEN_SECRET', config: JWT_CONFIG.REFRESH_TOKEN.SECRET },
    { key: 'DB_HOST', config: DB_CONFIG.HOST },
    // Add other required variables
  ];

  const missingVars = requiredVars.filter(v => !v.config);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.map(v => v.key).join(', ')}`);
  }
  
  return true;
};

// For direct access to process.env (legacy support)
export const ENV_VARS = process.env;