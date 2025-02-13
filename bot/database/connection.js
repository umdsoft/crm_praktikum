const mysql = require('mysql2/promise');
const config = require('../config/config');
const logger = require('../utils/logger');

let connectionPool = null;

async function createDbConnection() {
    try {
        const connection = await mysql.createConnection({
            host: config.DB_CONFIG.host,
            user: config.DB_CONFIG.user,
            password: config.DB_CONFIG.password,
            database: config.DB_CONFIG.database
        });

        // Test connection
        await connection.ping();
        
        return connection;
    } catch (error) {
        logger.error('Database connection error:', error);
        throw new Error('Database connection failed');
    }
}

// Pool ni tozalash uchun
async function closePool() {
    if (connectionPool) {
        await connectionPool.end();
        connectionPool = null;
        logger.info('MySQL connection pool yopildi');
    }
}

process.on('SIGINT', async () => {
    await closePool();
    process.exit(0);
});

module.exports = { 
    createDbConnection,
    closePool 
}; 