import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import formsRouter from './routes/forms.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: [
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

app.use(express.static('public'));
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

app.use('/forms', formsRouter);
app.use('/', formsRouter);

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
            forms: '/forms',
            bookedSlots: '/booked-slots?date=YYYY-MM-DD',
            health: '/health'
        }
    });
});

app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path
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
    ✅ CORS enabled for ${process.env.CLIENT_URL || 'http://localhost:5173'}
    📧 Email service: ${process.env.MAIL_HOST || 'Not configured'}
    `);
});

export default app;