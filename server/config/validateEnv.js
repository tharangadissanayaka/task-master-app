const logger = require('../config/logger');

// Validate required environment variables
function validateEnv() {
    const required = ['JWT_SECRET', 'MONGO_URI'];
    const missing = [];

    required.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });

    if (missing.length > 0) {
        logger.error(`Missing required environment variables: ${missing.join(', ')}`);
        console.error(`\n❌ FATAL ERROR: Missing required environment variables: ${missing.join(', ')}`);
        console.error('Please check your .env file and ensure all required variables are set.\n');
        process.exit(1);
    }

    logger.info('✅ All required environment variables are set');
}

module.exports = { validateEnv };
