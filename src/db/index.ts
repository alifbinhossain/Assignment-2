import { Pool } from 'pg';
import config from '../config';

export const pool = new Pool({
  connectionString: config.connection_string,
});

export const initDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(120) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'contributor',
    
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
        `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,

        title VARCHAR(150) NOT NULL,
        description TEXT 
        NOT NULL 
        CHECK (char_length(description) >= 20),

        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'open',

        reporter_id INT REFERENCES users(id) ON DELETE CASCADE,

        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
        `);
    console.log(`Database connected successfully!`);
  } catch (error) {
    console.log({ error });
  }
};
