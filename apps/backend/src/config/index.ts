import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 6190,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/servitec',
  jwtSecret: process.env.JWT_SECRET || 'servitec-dev-secret-change-in-production',
  jwtExpires: process.env.JWT_EXPIRES || '7d',
};
