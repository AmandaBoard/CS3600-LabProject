require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');
const fs = require('fs/promises');
const path = require('path');

// details for MySQL server
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

const sqlFilePath = path.join(__dirname, 'schema.sql');

async function setupDatabase() {
  let connection;
  try {
    console.log('--- Starting Database Setup ---');

    // establish connection to the MySQL Server
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL server successfully.');

    // read SQL file
    const sql = await fs.readFile(sqlFilePath, { encoding: 'utf-8' });

    // execute SQL code
    await connection.query({
      sql: sql,
      multipleStatements: true
    });

    console.log(`Database and tables created successfully using ${sqlFilePath}`);

  } catch (error) {
    console.error('Failed to setup database:', error.message);
    process.exit(1); // Exit with a failure code
  } finally {
    // close the connection
    if (connection) {
      await connection.end();
      console.log('Connection closed.');
    }
  }
}

setupDatabase();