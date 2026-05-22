// backend/routes/forms.js
import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// Конфигурация почты (замените на реальные данные)
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: process.env.MAIL_PORT || 587,
    secure: process.env.MAIL_SECURE === 'true' || false,
    auth: {
        user: process.env.MAIL_USER || 'your-email@gmail.com',
        pass: process.env.MAIL_PASSWORD || 'your-password'
    }
});

// Хранилище забронированных времен (в боевой версии используйте БД)
const bookedSlots = new Map();

// Получить забронированные слоты на определенную дату
router.get('/booked-slots', (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({
            error: 'Date parameter is required'
        });
    }

    const bookedHours = bookedSlots.get(date) || [];

    res.json({
        date,
        bookedHours,
        message: `Booked hours for ${date}`
    });
});

// Обработка формы заказа
router.post('/forms', async (req, res) => {
    try {
        const { type, data } = req.body;

        // Валидация типа формы
        if (!type || !['service', 'contact'].includes(type)) {
            return res.status(400).json({
                error: 'Invalid form type'
            });
        }

        // Валидация обязательных полей
        const requiredFields = ['name', 'lastname', 'email'];
        for (const field of requiredFields) {
            if (!data[field] || typeof data[field] !== 'string') {
                return res.status(400).json({
                    error: `Field "${field}" is required`
                });
            }
        }

        // Специальная валидация для service формы
        if (type === 'service') {
            const serviceFields = ['phone', 'street', 'postal_code', 'property_type', 'services'];
            for (const field of serviceFields) {
                if (!data[field]) {
                    return res.status(400).json({
                        error: `Field "${field}" is required for service form`
                    });
                }
            }

            // Проверка данных бронирования
            if (!data.booking || !data.booking.date || data.booking.timeFrom === null || data.booking.timeTo === null) {
                return res.status(400).json({
                    error: 'Booking data is incomplete'
                });
            }

            // Проверка, не заняты ли слоты
            const bookedHours = bookedSlots.get(data.booking.date) || [];
            for (let hour = data.booking.timeFrom; hour <= data.booking.timeTo; hour++) {
                if (bookedHours.includes(hour)) {
                    return res.status(409).json({
                        error: `Time slot ${hour}:00 is already booked`
                    });
                }
            }

            // Бронируем слоты
            const newBookedHours = [
                ...bookedHours,
                ...Array.from(
                    { length: data.booking.timeTo - data.booking.timeFrom + 1 },
                    (_, i) => data.booking.timeFrom + i
                )
            ];
            bookedSlots.set(data.booking.date, newBookedHours);

            console.log(`📅 Booked time slots for ${data.booking.date}:`, newBookedHours);
        }

        // Подготовка письма
        const emailContent = generateEmailContent(type, data);

        // Отправка письма администратору
        await sendEmail(
            process.env.ADMIN_EMAIL || 'admin@example.com',
            `Neue ${type === 'service' ? 'Service' : 'Kontakt'} Anfrage`,
            emailContent
        );

        // Отправка подтверждения клиенту
        const confirmationEmail = generateConfirmationEmail(type, data);
        await sendEmail(
            data.email,
            'Anfrage bestätigt - Vielen Dank!',
            confirmationEmail
        );

        // Логирование в БД (если нужно)
        console.log(`✅ ${type === 'service' ? 'Service' : 'Contact'} form submitted:`, {
            name: data.name,
            email: data.email,
            timestamp: new Date().toISOString(),
            type: type,
            services: type === 'service' ? data.services : undefined
        });

        return res.status(200).json({
            success: true,
            message: `Ihre Anfrage wurde erfolgreich gesendet. Sie erhalten in Kürze eine Bestätigung per Email.`,
            formId: generateFormId()
        });

    } catch (error) {
        console.error('❌ Form submission error:', error);

        return res.status(500).json({
            error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Функция для отправки письма
async function sendEmail(to, subject, html) {
    try {
        const info = await transporter.sendMail({
            from: process.env.MAIL_FROM || 'noreply@example.com',
            to,
            subject,
            html,
            text: stripHtml(html)
        });

        console.log('📧 Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        throw error;
    }
}

// Генерация HTML письма для администратора
function generateEmailContent(type, data) {
    const baseHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Neue ${type === 'service' ? 'Service-Anfrage' : 'Kontaktanfrage'}</h2>
            
            <h3 style="color: #4a90e2; margin-top: 20px;">Kundendaten</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background-color: #f5f5f5;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Vorname</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(data.name)}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Nachname</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(data.lastname)}</td>
                </tr>
                <tr style="background-color: #f5f5f5;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td>
                </tr>
    `;

    let html = baseHtml;

    if (type === 'service') {
        html += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Telefon</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(data.phone)}</td>
                </tr>
                <tr style="background-color: #f5f5f5;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Adresse</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(data.street)}<br>${escapeHtml(data.postal_code)} ${escapeHtml(data.city || '')}</td>
                </tr>
            </table>

            <h3 style="color: #4a90e2; margin-top: 20px;">Service-Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background-color: #f5f5f5;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Wohnungstyp</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(data.property_type)}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Services</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${formatServicesList(data.services)}</td>
                </tr>
                ${data.requirements && data.requirements.length > 0 ? `
                <tr style="background-color: #f5f5f5;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Spezielle Anforderungen</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${formatServicesList(data.requirements)}</td>
                </tr>
                ` : ''}
            </table>

            <h3 style="color: #4a90e2; margin-top: 20px;">Termin</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background-color: #f5f5f5;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Datum</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(data.booking.date)}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Uhrzeit</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${String(data.booking.timeFrom).padStart(2, '0')}:00 - ${String(data.booking.timeTo).padStart(2, '0')}:00</td>
                </tr>
                <tr style="background-color: #f5f5f5;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Dauer</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${data.booking.duration} Stunde${data.booking.duration > 1 ? 'n' : ''}</td>
                </tr>
            </table>
        `;
    }

    if (data.details) {
        html += `
            <h3 style="color: #4a90e2; margin-top: 20px;">Zusätzliche Anforderungen</h3>
            <p style="padding: 15px; background-color: #f9f9f9; border-left: 4px solid #4a90e2;">
                ${escapeHtml(data.details).replace(/\n/g, '<br>')}
            </p>
        `;
    }

    html += `
            <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
                Eingereicht am: ${new Date().toLocaleString('de-DE')}
            </p>
        </div>
    `;

    return html;
}

// Генерация подтверждающего письма для клиента
function generateConfirmationEmail(type, data) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #50c878;">Vielen Dank für Ihre Anfrage!</h2>
            <p>Lieber ${escapeHtml(data.name)},</p>
            <p>wir haben Ihre Anfrage erfolgreich erhalten und werden uns in Kürze mit Ihnen in Verbindung setzen.</p>
            
            ${type === 'service' ? `
                <h3 style="color: #4a90e2; margin-top: 20px;">Ihre Terminbuchung</h3>
                <p>
                    <strong>Datum:</strong> ${formatDate(data.booking.date)}<br>
                    <strong>Uhrzeit:</strong> ${String(data.booking.timeFrom).padStart(2, '0')}:00 - ${String(data.booking.timeTo).padStart(2, '0')}:00<br>
                    <strong>Dauer:</strong> ${data.booking.duration} Stunde${data.booking.duration > 1 ? 'n' : ''}
                </p>
            ` : ''}
            
            <p style="margin-top: 20px; padding: 15px; background-color: #f0f8ff; border-left: 4px solid #4a90e2; color: #333;">
                Unser Team wird sich in den nächsten 24 Stunden mit Ihnen in Verbindung setzen, um alle Details zu klären.
            </p>
            
            <p style="color: #666; margin-top: 20px;">
                Mit freundlichen Grüßen<br>
                Das Reinigungsteam
            </p>
        </div>
    `;
}

// Утилиты
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
}

function formatServicesList(services) {
    const serviceNames = {
        floor: 'Bodenreinigung',
        windows: 'Fensterreinigung',
        deep: 'Tiefenreinigung',
        kitchen: 'Küchenreinigung',
        bathroom: 'Badezimmerreinigung',
        carpet: 'Teppichreinigung',
        hypoallergenic: 'Hypoallergene Reinigungsmittel',
        eco: 'Umweltfreundliche Produkte',
        pet_friendly: 'Haustiere anwesend'
    };

    return Array.isArray(services)
        ? services.map(s => serviceNames[s] || s).join(', ')
        : services;
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function generateFormId() {
    return `FORM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

export default router;