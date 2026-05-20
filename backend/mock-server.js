

const http = require('http');
const url = require('url');

const bookedSlots = {
    '2026-05-20': [12, 13, 14, 15],
    '2026-05-21': [10, 11, 12, 13, 14],
    '2026-05-22': [9, 10, 11, 12, 13, 14, 15, 16],
};

const bookings = [];

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'GET' && req.url.startsWith('/booked-slots')) {
        const query = url.parse(req.url, true).query;
        const date = query.date;

        const booked = bookedSlots[date] || [];
        console.log(`📅 GET /booked-slots?date=${date} → ${JSON.stringify(booked)}`);

        res.writeHead(200);
        res.end(JSON.stringify({
            date,
            bookedHours: booked,
            availableHours: Array.from({ length: 9 }, (_, i) => i + 9).filter(h => !booked.includes(h))
        }));
        return;
    }

    if (req.method === 'POST' && req.url === '/bookings') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const booking = JSON.parse(body);

                if (!booking.name || !booking.email || !booking.services.length) {
                    res.writeHead(400);
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Заполните все поля'
                    }));
                    return;
                }

                const key = booking.date;
                const bookedHours = bookedSlots[key] || [];

                if (bookedHours.includes(booking.timeFrom) || bookedHours.includes(booking.timeTo - 1)) {
                    res.writeHead(409);
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Это время уже забронировано'
                    }));
                    return;
                }

                bookings.push({
                    id: Date.now(),
                    ...booking,
                    createdAt: new Date().toISOString()
                });

                if (!bookedSlots[key]) {
                    bookedSlots[key] = [];
                }
                for (let h = booking.timeFrom; h < booking.timeTo; h++) {
                    bookedSlots[key].push(h);
                }
                bookedSlots[key].sort((a, b) => a - b);

                console.log(`✅ POST /bookings → Успешно!`);
                console.log(`📝 Бронирование:`, booking);
                console.log(`📅 Забронированные часы на ${key}:`, bookedSlots[key]);

                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    message: '✅ Termin erfolgreich gebucht!',
                    bookingId: Date.now(),
                    booking
                }));
            } catch (error) {
                console.error('❌ Ошибка:', error.message);
                res.writeHead(500);
                res.end(JSON.stringify({
                    success: false,
                    message: 'Ошибка сервера'
                }));
            }
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/bookings') {
        console.log(`📋 GET /bookings → ${bookings.length} бронирований`);
        res.writeHead(200);
        res.end(JSON.stringify({
            total: bookings.length,
            bookings
        }));
        return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`

GET  /booked-slots?date=2026-05-20    
POST /bookings                        
GET  /bookings (все бронирования)     

    `);
});