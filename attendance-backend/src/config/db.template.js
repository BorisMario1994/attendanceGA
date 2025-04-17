const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'abc123',
    server: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'master',
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

let poolConnect;

try {
    poolConnect = pool.connect();
    poolConnect.then(() => {
        console.log('Connected to SQL Server successfully.');
    }).catch(err => {
        console.error('SQL connection failed:', err);
    });
} catch (err) {
    console.error('Unexpected error during SQL connection setup:', err);
}

pool.on('error', err => {
    console.error('Database connection error:', err);
});

module.exports = {
    pool,
    poolConnect
};
