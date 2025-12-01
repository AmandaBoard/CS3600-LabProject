// server.js

// 1. Import necessary modules
const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load environment variables from a .env file
dotenv.config();

// 2. Initialize the Express application
const app = express();
const port = process.env.PORT || 3307;

// 3. Middleware
// Use express.json() to parse incoming JSON requests (for POST requests)
app.use(express.json());

// Set up CORS (Cross-Origin Resource Sharing) for local testing
// This allows your HTML files (which run in the browser) to communicate with the server
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow requests from any origin (change this for production)
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// 4. Create the MySQL Connection Pool
// A pool manages multiple connections, which is better for performance than a single connection
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection to the database
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        process.exit(1); // Exit if connection fails
    }
    console.log('Successfully connected to MySQL as id ' + connection.threadId);
    connection.release();
});

// 5. Define API Endpoints

/**
 * Endpoint 1: GET /api/users
 * Fetches all user records from the 'users' table.
 */
app.get('/api/users', (req, res) => {
    const sql = 'SELECT id, name, email FROM users';

    pool.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ error: 'Failed to retrieve users.' });
        }
        // Send the query results back as a JSON array
        res.json({
            message: 'Users retrieved successfully',
            data: results
        });
    });
});

/**
 * Endpoint 2: POST /api/users
 * Adds a new user record to the 'users' table.
 * Expects a JSON body: { "name": "John Doe", "email": "john@example.com" }
 */
app.post('/api/users', (req, res) => {
    // Get name and email from the request body
    const { name, email } = req.body;

    // Simple validation
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required fields.' });
    }

    // SQL query using '?' placeholders for security (prevents SQL Injection)
    const sql = 'INSERT INTO users (name, email) VALUES (?, ?)';
    const values = [name, email];

    pool.query(sql, values, (error, results) => {
        if (error) {
            console.error('Database insert error:', error);
            return res.status(500).json({ error: 'Failed to add user to the database.' });
        }
        
        // Respond with success and the ID of the new user
        res.status(201).json({ 
            message: 'User added successfully',
            userId: results.insertId,
            user: { name, email }
        });
    });
});

// 6. Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log('Use CTRL+C to stop the server.');
});