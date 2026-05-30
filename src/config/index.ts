import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const config = {
  connection_string: process.env.CONNECTION_STRING as string,
  port: Number(process.env.PORT),
  secret: process.env.JWT_SECRET as string,
  secret_expiry: process.env.JWT_SECRET_EXPIRY as any,
};

export default config;
