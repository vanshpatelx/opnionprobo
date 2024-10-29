import { Pool } from 'pg';

const pool = new Pool({
  user: 'myuser',
  host: 'localhost',
  database: 'mydb',
  password: 'mypassword',
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function initializePostgres() {
  const client = await pool.connect(); 
  try {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS Users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      )
    `;

    const createEventsTable = `
      CREATE TABLE IF NOT EXISTS Events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        endTime TIMESTAMP NOT NULL,
        description TEXT,
        sourceOfTruth VARCHAR(100)
      )
    `;

    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS Categories (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        icon VARCHAR(100),
        description TEXT
      )
    `;

    await client.query(createUsersTable);
    await client.query(createEventsTable);
    await client.query(createCategoriesTable);

    console.log('PostgreSQL initialized and tables created successfully.');
  } catch (error) {
    console.error('Error initializing PostgreSQL:', error);
  } finally {
    client.release();
  }
}

export { pool, initializePostgres };
