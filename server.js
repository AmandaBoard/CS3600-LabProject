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
 * Endpoint: POST /api/orders
 * Receives order details from the HTML form and saves them to the database.
 */
app.post('/api/orders', (req, res) => {
    // 1. Destructure the data sent from the HTML page
    const { name, email, pickup, payment, message } = req.body;

    // 2. Validate that we have the minimum required info
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing required order details.' });
    }

    // 3. Prepare SQL to insert into the 'orders' table
    const sql = `INSERT INTO orders 
                 (customer_name, email, pickup_time, payment_method, order_description) 
                 VALUES (?, ?, ?, ?, ?)`;
    
    const values = [name, email, pickup, payment, message];

    // 4. Run the query
    pool.query(sql, values, (error, results) => {
        if (error) {
            console.error('Database insert error:', error);
            return res.status(500).json({ error: 'Failed to place order.' });
        }
        
        // 5. Success! Send back the new Order ID
        res.status(201).json({ 
            message: 'Order placed successfully!', 
            orderId: results.insertId 
        });
    });
});

/**
 * Endpoint: POST /api/applicants
 * Saves hiring form submissions to the database.
 */
app.post('/api/applicants', (req, res) => {
    const { name, email, position, resume } = req.body;

    if (!name || !email || !position || !resume) {
        return res.status(400).json({ error: 'Missing required applicant fields.' });
    }

    const sql = `
        INSERT INTO applicants (name, email, position, resume)
        VALUES (?, ?, ?, ?)
    `;

    const values = [name, email, position, resume];

    pool.query(sql, values, (error, results) => {
        if (error) {
            console.error('Applicant insert error:', error);
            return res.status(500).json({ error: 'Failed to submit application.' });
        }

        res.status(201).json({
            message: 'Application submitted successfully!',
            applicantId: results.insertId
        });
    });
});


/**
 * Endpoint: GET /api/orders
 * (Optional) View all orders for the kitchen display
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

// 6. Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log('Use CTRL+C to stop the server.');
});