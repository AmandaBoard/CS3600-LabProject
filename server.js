// server.js
const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');

// load environemnt variables from local .env
dotenv.config();

// init express
const app = express();
const port = process.env.PORT || 3307;

// express.json() for POST requests
app.use(express.json());

// Set up CORS (Cross-Origin Resource Sharing) for local testing
// This allows your HTML files (which run in the browser) to communicate with the server
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// check database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        process.exit(1);
    }
    console.log('Connected to MySQL as id ' + connection.threadId);
    connection.release();
});

// API Endpoints

/**
 * Endpoint: POST /api/orders
 * Receive order details from HTML form and saves to the database
 */
app.post('/api/orders', (req, res) => {
    // parse the data sent from the HTML page
    const { name, email, pickup, payment, message } = req.body;

    // check we got all necessary info
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing required order details.' });
    }

    // setup SQL to insert into the 'orders' table
    const sql = `INSERT INTO orders 
                 (customer_name, email, pickup_time, payment_method, order_description) 
                 VALUES (?, ?, ?, ?, ?)`;
    
    const values = [name, email, pickup, payment, message];

    // run query
    pool.query(sql, values, (error, results) => {
        if (error) {
            console.error('Database insert error:', error);
            return res.status(500).json({ error: 'Failed to place order' });
        }
        
        // return new Order ID
        res.status(201).json({ 
            message: 'Order placed successfully!', 
            orderId: results.insertId 
        });
    });
});

/**
 * Endpoint: GET /api/orders
 */
app.get('/api/orders', (req, res) => {
    const sql = 'SELECT * FROM orders ORDER BY created_at DESC';

    pool.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});