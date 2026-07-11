const app = require('./app');
const { testConnection } = require('./src/config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await testConnection();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Server failed to start:', error.message);
        process.exit(1);
    }
};

startServer();