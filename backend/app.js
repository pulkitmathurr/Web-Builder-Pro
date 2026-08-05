const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const routes = require('./src/routes/index.routes');

const app = express();

// ── Middlewares ──────────────────────────────────────
// TODO: lock this down to the Vercel URL (via FRONTEND_URL) once it's known —
// `origin: true` reflects whatever Origin header the request sent, which
// accepts everything for now while still working with credentials:true
// (a literal '*' origin is rejected by browsers when credentials are used).
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ── Test Route ───────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'School SaaS API is running 🚀' 
    });
});

// ── All Routes ───────────────────────────────────────
app.use('/api', routes);

// ── 404 Handler ──────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

// ── Global Error Handler ─────────────────────────────
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(err.status || 500).json({ 
//         success: false, 
//         message: err.message || 'Internal server error' 
//     });
// });

// ── Global Error Handler ─────────────────────────────
app.use((err, req, res, next) => {
    console.error('ERROR DETAILS:', err);
    console.error('ERROR MESSAGE:', err?.message);
    console.error('ERROR STACK:', err?.stack);
    res.status(err.status || 500).json({ 
        success: false, 
        message: err.message || 'Internal server error' 
    });
});
module.exports = app;