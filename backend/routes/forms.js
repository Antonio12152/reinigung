import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

let transporter = null;

/* ============================================================================
   EMAIL INITIALIZATION
============================================================================ */

async function initializeTransporter() {
    try {
        console.log('\n📧 Initializing email transporter...\n');

        console.log({
            MAIL_HOST: process.env.MAIL_HOST,
            MAIL_PORT: process.env.MAIL_PORT,
            MAIL_USER: process.env.MAIL_USER,
            MAIL_PASSWORD: process.env.MAIL_PASSWORD ? 'SET' : 'NOT SET'
        });

        if (
            !process.env.MAIL_HOST ||
            !process.env.MAIL_USER ||
            !process.env.MAIL_PASSWORD
        ) {
            throw new Error('Missing email environment variables');
        }

        transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT) || 587,
            secure: process.env.MAIL_SECURE === 'true',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD
            }
        });

        await transporter.verify();

        console.log('✅ Email transporter verified successfully\n');

    } catch (error) {
        console.error('❌ Email transporter error:\n');
        console.error(error.message);
        transporter = null;
    }
}

await initializeTransporter();

/* ============================================================================
   VALIDATION HELPERS
============================================================================ */

function sanitizeString(value) {
    if (typeof value !== 'string') return '';
    return value.trim();
}

function validateRequired(value, field) {
    if (value == null || value === '') {
        return `${field} is required`;
    }
    return null;
}

function validateName(name, field = 'Name') {
    name = sanitizeString(name);

    if (!name) {
        return `${field} is required`;
    }

    if (name.length < 2) {
        return `${field} must contain at least 2 characters`;
    }

    if (name.length > 50) {
        return `${field} is too long`;
    }

    if (!/^[a-zA-ZäöüÄÖÜß\s-]+$/u.test(name)) {
        return `${field} contains invalid characters`;
    }

    return null;
}

function validateEmail(email) {
    email = sanitizeString(email);

    if (!email) {
        return 'Email is required';
    }

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(email)) {
        return 'Invalid email address';
    }

    return null;
}

function validatePhone(phone) {
    phone = sanitizeString(phone);

    if (!phone) {
        return 'Phone number is required';
    }

    if (!/^[\d+\-\s()]+$/.test(phone)) {
        return 'Invalid phone number';
    }

    if (phone.length < 6 || phone.length > 20) {
        return 'Phone number length is invalid';
    }

    return null;
}

function validatePostalCode(postalCode) {
    postalCode = sanitizeString(postalCode);

    if (!postalCode) {
        return 'Postal code is required';
    }

    if (!/^\d{5}$/.test(postalCode)) {
        return 'Postal code must contain 5 digits';
    }

    return null;
}

function validateText(text, field, min = 2, max = 500) {
    text = sanitizeString(text);

    if (!text) {
        return `${field} is required`;
    }

    if (text.length < min) {
        return `${field} is too short`;
    }

    if (text.length > max) {
        return `${field} is too long`;
    }

    return null;
}

function validateArray(arr, field) {
    if (!Array.isArray(arr) || arr.length === 0) {
        return `${field} must contain at least one item`;
    }

    return null;
}

/* ============================================================================
   SANITIZE HTML
============================================================================ */

function escapeHtml(text = '') {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return String(text).replace(/[&<>"']/g, m => map[m]);
}

/* ============================================================================
   EMAIL
============================================================================ */

async function sendEmail(to, subject, html) {
    if (!transporter) {
        throw new Error('Email transporter not initialized');
    }

    const info = await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.MAIL_USER,
        to,
        subject,
        html,
        text: html.replace(/<[^>]*>/g, '')
    });

    console.log(`✅ Email sent to ${to}`);
    console.log(`📨 Message ID: ${info.messageId}`);

    return info;
}

/* ============================================================================
   EMAIL TEMPLATES
============================================================================ */

function generateAdminEmail(data, formType = 'service') {
    if (formType === 'contact') {
        return `
        <table style="
                    width:100%;
                    border-collapse: collapse;
                    margin-bottom:30px;
                ">
                    <tr>
                        <td style="${tdTitle}">
                            Vorname
                        </td>

                        <td style="${tdValue}">
                            ${escapeHtml(data.name)}
                        </td>
                    </tr>

                    <tr>
                        <td style="${tdTitle}">
                            Nachname
                        </td>

                        <td style="${tdValue}">
                            ${escapeHtml(data.lastname)}
                        </td>
                    </tr>

                    <tr>
                        <td style="${tdTitle}">
                            E-Mail
                        </td>

                        <td style="${tdValue}">
                            <a href="mailto:${escapeHtml(data.email)}">
                                ${escapeHtml(data.email)}
                            </a>
                        </td>
                    </tr>
                </table>
                <h2 style="
                    color:#357ABD;
                    margin-top:30px;
                    margin-bottom:15px;
                ">
                    Nachricht
                </h2>

                <div style="
                    background:#f7f9fc;
                    padding:20px;
                    border-radius:8px;
                    line-height:1.7;
                    color:#444;
                ">
                    ${escapeHtml(data.message || '')}
                </div>
                `;

    }
    return `
        <div style="
            font-family: Arial, sans-serif;
            max-width: 650px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            overflow: hidden;
        ">
            
            <div style="
                background: linear-gradient(135deg, #4a90e2, #357ABD);
                padding: 30px;
                color: white;
            ">
                <h1 style="margin:0; font-size:28px;">
                    Neue Reinigungsanfrage
                </h1>

                <p style="
                    margin-top:10px;
                    opacity:0.9;
                    font-size:15px;
                ">
                    Eine neue Anfrage wurde über die Website gesendet.
                </p>
            </div>

            <div style="padding: 30px;">

                <h2 style="
                    color:#357ABD;
                    margin-top:0;
                    margin-bottom:20px;
                    font-size:22px;
                ">
                    Kundendaten
                </h2>

                <table style="
                    width:100%;
                    border-collapse: collapse;
                    margin-bottom:30px;
                ">
                    <tr>
                        <td style="${tdTitle}">
                            Vorname
                        </td>

                        <td style="${tdValue}">
                            ${escapeHtml(data.name)}
                        </td>
                    </tr>

                    <tr>
                        <td style="${tdTitle}">
                            Nachname
                        </td>

                        <td style="${tdValue}">
                            ${escapeHtml(data.lastname)}
                        </td>
                    </tr>

                    <tr>
                        <td style="${tdTitle}">
                            E-Mail
                        </td>

                        <td style="${tdValue}">
                            <a href="mailto:${escapeHtml(data.email)}">
                                ${escapeHtml(data.email)}
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td style="${tdTitle}">
                            Telefon
                        </td>

                        <td style="${tdValue}">
                            ${escapeHtml(data.phone)}
                        </td>
                    </tr>

                    <tr>
                        <td style="${tdTitle}">
                            Adresse
                        </td>

                        <td style="${tdValue}">
                            ${escapeHtml(data.street)}<br>
                            ${escapeHtml(data.postal_code)}
                            ${escapeHtml(data.city)}
                        </td>
                    </tr>

                    <tr>
                        <td style="${tdTitle}">
                            Immobilientyp
                        </td>

                        <td style="${tdValue}">
                            ${escapeHtml(data.property_type)}
                        </td>
                    </tr>

                    <tr>
                        <td style="${tdTitle}">
                            Dienstleistungen
                        </td>

                        <td style="${tdValue}">
                            ${formatServices(data.services)}
                        </td>
                    </tr>
                </table>

                ${data.booking
            ? `
                    <h2 style="
                        color:#357ABD;
                        margin-bottom:20px;
                        font-size:22px;
                    ">
                        Termininformationen
                    </h2>

                    <table style="
                        width:100%;
                        border-collapse: collapse;
                        margin-bottom:30px;
                    ">
                        <tr>
                            <td style="${tdTitle}">
                                Datum
                            </td>

                            <td style="${tdValue}">
                                ${escapeHtml(data.booking.date || '')}
                            </td>
                        </tr>

                        <tr>
                            <td style="${tdTitle}">
                                Uhrzeit
                            </td>

                            <td style="${tdValue}">
                                ${escapeHtml(data.booking.timeFrom || '')}:00
                                -
                                ${escapeHtml(data.booking.timeTo || '')}:00
                            </td>
                        </tr>
                    </table>
                `
            : ''
        }

                ${data.details
            ? `
                    <h2 style="
                        color:#357ABD;
                        margin-bottom:15px;
                        font-size:22px;
                    ">
                        Zusätzliche Informationen
                    </h2>

                    <div style="
                        background:#f7f9fc;
                        padding:20px;
                        border-radius:8px;
                        line-height:1.7;
                        color:#444;
                    ">
                        ${escapeHtml(data.details)}
                    </div>
                `
            : ''
        }

            </div>

            <div style="
                background:#f5f7fa;
                padding:20px 30px;
                color:#777;
                font-size:13px;
                text-align:center;
            ">
                Eingegangen am ${new Date().toLocaleString('de-DE')}
            </div>

        </div>
    `;
}

function generateClientEmail(data, formType = 'service') {
    if (formType === 'contact') {
        return `
            <div style="
                background:#f7f9fc;
                padding:20px;
                border-radius:8px;
                margin:25px 0;
            ">
                <strong>Ihre Nachricht:</strong><br><br>

                ${escapeHtml(data.message || '')}
            </div>
            `;
    }
    return `
        <div style="
            font-family: Arial, sans-serif;
            max-width: 650px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            overflow: hidden;
        ">

            <div style="
                background: linear-gradient(135deg, #50c878, #37a85c);
                padding: 35px;
                text-align:center;
                color:white;
            ">
                <h1 style="
                    margin:0;
                    font-size:30px;
                ">
                    Vielen Dank!
                </h1>

                <p style="
                    margin-top:12px;
                    font-size:16px;
                    opacity:0.95;
                ">
                    Ihre Anfrage wurde erfolgreich übermittelt.
                </p>
            </div>

            <div style="padding:35px; color:#333;">

                <p style="
                    font-size:17px;
                    margin-top:0;
                ">
                    Hallo ${escapeHtml(data.name)},
                </p>

                <p style="
                    line-height:1.8;
                    font-size:15px;
                    color:#555;
                ">
                    vielen Dank für Ihre Anfrage und Ihr Interesse an unserem
                    Reinigungsservice.
                </p>

                <p style="
                    line-height:1.8;
                    font-size:15px;
                    color:#555;
                ">
                    Unser Team hat Ihre Anfrage erhalten und wird sich
                    schnellstmöglich mit Ihnen in Verbindung setzen, um alle
                    Details zu bestätigen.
                </p>

                ${data.booking
            ? `
                    <div style="
                        background:#f7f9fc;
                        border-left:4px solid #50c878;
                        padding:20px;
                        margin:30px 0;
                        border-radius:8px;
                    ">
                        <h3 style="
                            margin-top:0;
                            color:#37a85c;
                        ">
                            Ihre Buchungsinformationen
                        </h3>

                        <p style="margin:8px 0;">
                            <strong>Datum:</strong>
                            ${escapeHtml(data.booking.date || '')}
                        </p>

                        <p style="margin:8px 0;">
                            <strong>Uhrzeit:</strong>
                            ${escapeHtml(data.booking.timeFrom || '')}:00
                            -
                            ${escapeHtml(data.booking.timeTo || '')}:00
                        </p>
                    </div>
                `
            : ''
        }

                <div style="
                    background:#eef6ff;
                    border:1px solid #d8eaff;
                    padding:20px;
                    border-radius:8px;
                    margin-top:30px;
                ">
                    <p style="
                        margin:0;
                        color:#357ABD;
                        line-height:1.7;
                    ">
                        Unser Team antwortet normalerweise innerhalb von
                        24 Stunden.
                    </p>
                </div>

                <p style="
                    margin-top:35px;
                    line-height:1.8;
                    color:#555;
                ">
                    Mit freundlichen Grüßen<br>
                    <strong>Ihr Reinigungsteam</strong>
                </p>

            </div>

            <div style="
                background:#f5f7fa;
                padding:18px;
                text-align:center;
                color:#888;
                font-size:13px;
            ">
                © ${new Date().getFullYear()} Reinigungsservice
            </div>

        </div>
    `;
}

/* ============================================================================
   STYLES
============================================================================ */

const tdTitle = `
    padding:14px;
    width:220px;
    font-weight:bold;
    border-bottom:1px solid #eee;
    background:#f8fafc;
    color:#333;
`;

const tdValue = `
    padding:14px;
    border-bottom:1px solid #eee;
    color:#555;
`;

/* ============================================================================
   SERVICES FORMATTER
============================================================================ */

function formatServices(services = []) {

    const map = {
        floor: 'Bodenreinigung',
        windows: 'Fensterreinigung',
        deep: 'Tiefenreinigung',
        kitchen: 'Küchenreinigung',
        bathroom: 'Badezimmerreinigung',
        carpet: 'Teppichreinigung'
    };

    if (!Array.isArray(services)) {
        services = [services];
    }

    return services
        .map(service => map[service] || service)
        .join(', ');
}

/* ============================================================================
   ROUTE
============================================================================ */

router.post('/', async (req, res) => {
    try {
        console.log('\n══════════════════════════════');
        console.log('📥 NEW FORM REQUEST');
        console.log('══════════════════════════════\n');

        const data = req.body.data || req.body;

        /* ============================
           FORM TYPE
        ============================ */

        const formType = data.type || req.body.type || 'service';

        console.log(`📨 Form type: ${formType}`);

        /* ============================
           COMMON VALIDATION
        ============================ */

        const errors = [];

        const commonValidators = [
            validateName(data.name, 'Vorname'),
            validateName(data.lastname, 'Nachname'),
            validateEmail(data.email)
        ];

        commonValidators.forEach(error => {
            if (error) errors.push(error);
        });

        /* ============================
           CONTACT FORM VALIDATION
        ============================ */

        if (formType === 'contact') {

            if (data.message) {
                const messageError = validateText(
                    data.message,
                    'Nachricht',
                    2,
                    2000
                );

                if (messageError) {
                    errors.push(messageError);
                }
            }

        }

        /* ============================
           SERVICE FORM VALIDATION
        ============================ */

        if (formType === 'service') {

            const serviceValidators = [
                validatePhone(data.phone),
                validateText(data.street, 'Straße'),
                validatePostalCode(data.postal_code),
                validateText(data.city, 'Stadt'),
                validateText(data.property_type, 'Immobilientyp'),
                validateArray(data.services, 'Dienstleistungen')
            ];

            serviceValidators.forEach(error => {
                if (error) errors.push(error);
            });

        }

        /* ============================
           VALIDATION ERRORS
        ============================ */

        if (errors.length > 0) {

            console.log('❌ Validation failed');
            console.log(errors);

            return res.status(400).json({
                success: false,
                errors
            });
        }
        /* ============================
           EMAILS
        ============================ */

        const adminHtml = generateAdminEmail(data, formType);

        await sendEmail(
            process.env.ADMIN_EMAIL,
            formType === 'contact'
                ? 'Neue Kontaktanfrage'
                : 'Neue Reinigungsanfrage',
            adminHtml
        );

        const clientHtml = generateClientEmail(data, formType);

        await sendEmail(
            data.email,
            'Vielen Dank für Ihre Anfrage',
            clientHtml
        );

        /* ============================
           SUCCESS
        ============================ */

        console.log('✅ Form processed successfully\n');

        return res.status(200).json({
            success: true,
            message: 'Form submitted successfully'
        });

    } catch (error) {
        console.error('\n❌ FORM ERROR:\n');
        console.error(error);

        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details:
                process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined
        });
    }
});

export default router;