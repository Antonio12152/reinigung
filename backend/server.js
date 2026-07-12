import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import formsRouter from './routes/forms.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Middleware для обработки JSON и форм
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Sicherheits-Header setzen
app.use(helmet());

// CORS конфигурация
app.use(cors({
    origin: [
        // 'http://127.0.0.1:5500',
        // 'http://localhost:5500',
        // 'http://localhost:5173',
        'https://v-reinigung.netlify.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// Simple request validation for allowed content types
app.use((req, res, next) => {
    if (['POST', 'PUT'].includes(req.method)) {
        const contentType = req.get('content-type') || '';
        if (!contentType.includes('application/json') && !contentType.includes('application/x-www-form-urlencoded')) {
            return res.status(415).json({
                error: 'Unsupported media type'
            });
        }
    }
    next();
});

const formLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut.'
    }
});

// test replace with normal later
// const bookedSlots = new Map();

// app.get('/booked-slots', (req, res) => {
//     const { date } = req.query;

//     if (!date) {
//         return res.status(400).json({
//             error: 'Date is required'
//         });
//     }

//     const bookedHours = bookedSlots.get(date) || [];

//     console.log(`📅 Requested booked slots for ${date}`);
//     console.log('Booked:', bookedHours);

//     res.json({
//         date,
//         bookedHours
//     });
// });

app.use((req, res, next) => {
    console.log(`\n${new Date().toISOString()} ${req.method} ${req.path}`);

    if (process.env.NODE_ENV === 'development' && ['POST', 'PUT'].includes(req.method)) {
        console.log(`Content-Type: ${req.get('content-type')}`);
        console.log(`Body size: ${JSON.stringify(req.body).length} bytes`);
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }

    next();
});

app.use(express.static('public', {
    dotfiles: 'ignore',
    index: false,
    maxAge: '1d'
}));

app.use('/forms', formLimiter, formsRouter);

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Cleaning Service API',
        version: '1.0.0',
        endpoints: {
            forms: 'POST /forms',
            //bookedSlots: '/booked-slots?date=YYYY-MM-DD',
            health: 'GET /health'
        }
    });
});

app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

app.use((err, req, res, next) => {
    console.error('❌ Error:', err);

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { details: err.stack })
    });
});


app.listen(PORT, () => {
    console.log(`
    🚀 Server running at http://localhost:${PORT}
    ✅ CORS enabled for:
       - http://127.0.0.1:5500
       - http://localhost:5500
       - http://localhost:5173
    📝 Forms endpoint: POST http://localhost:${PORT}/forms
    🏥 Health check: GET http://localhost:${PORT}/health
    `);
});

export default app;