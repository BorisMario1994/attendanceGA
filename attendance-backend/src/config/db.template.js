const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'your_username',
    password: process.env.DB_PASSWORD || 'your_password',
    server: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'attendance_db',
    options: {
        encrypt: true,
        trustServerCertificate: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

pool.on('error', err => {
    console.error('Database connection error:', err);
});

module.exports = {
    pool,
    poolConnect
};