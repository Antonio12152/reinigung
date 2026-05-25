// backend/routes/forms.js
import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

let transporter;

async function initializeTransporter() {
    try {
        if (process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASSWORD) {
            transporter = nodemailer.createTransport({
                host: process.env.MAIL_HOST,
                port: parseInt(process.env.MAIL_PORT) || 587,
                secure: process.env.MAIL_SECURE === 'true' ? true : false,
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASSWORD
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            await transporter.verify();
            console.log('✅ Email transporter verified successfully');
        } else {
            console.warn('⚠️ Email configuration not complete. Using test account.');

            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });

            console.log('📧 Test email account created');
            console.log(`   User: ${testAccount.user}`);
            console.log(`   Pass: ${testAccount.pass}`);
        }
    } catch (error) {
        console.error('❌ Email transporter initialization failed:', error.message);
        console.warn('⚠️ Email sending will be disabled');
        transporter = null;
    }
}

initializeTransporter().catch(console.error);

const bookedSlots = new Map();

function validatePostalCode(postalCode) {
    if (!postalCode) {
        return 'Postleitzahl ist erforderlich';
    }

    const cleaned = String(postalCode).replace(/\D/g, '');

    if (cleaned.length !== 5) {
        return 'Postleitzahl muss genau 5 Ziffern haben';
    }

    const numValue = parseInt(cleaned);
    if (numValue < 1001 || numValue > 99999) {
        return 'Postleitzahl ist außerhalb des gültigen Bereichs';
    }

    return null;
}

function validateCity(city) {
    if (!city) {
        return 'Stadt ist erforderlich';
    }

    const trimmed = String(city).trim();

    if (trimmed.length < 2) {
        return 'Stadtnamen muss mindestens 2 Zeichen haben';
    }

    if (trimmed.length > 50) {
        return 'Stadtnamen darf nicht länger als 50 Zeichen sein';
    }

    if (!/^[a-zA-ZäöüßÄÖÜ\s\-]+$/.test(trimmed)) {
        return 'Stadtnamen darf nur Buchstaben, Leerzeichen und Bindestriche enthalten';
    }

    return null;
}

function validatePhone(phone) {
    if (!phone) {
        return 'Telefonnummer ist erforderlich';
    }

    const trimmed = String(phone).trim();

    if (trimmed.length < 5) {
        return 'Telefonnummer zu kurz';
    }

    if (trimmed.length > 20) {
        return 'Telefonnummer zu lang';
    }

    if (!/^[\d\s\+\-\(\)]+$/.test(trimmed)) {
        return 'Ungültige Telefonnummer';
    }

    return null;
}

function validateEmail(email) {
    if (!email) {
        return 'Email ist erforderlich';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Ungültige Email-Adresse';
    }

    return null;
}

function validateStreet(street) {
    if (!street) {
        return 'Straße und Hausnummer sind erforderlich';
    }

    const trimmed = String(street).trim();

    if (trimmed.length < 3) {
        return 'Straße und Hausnummer müssen mindestens 3 Zeichen lang sein';
    }

    if (trimmed.length > 100) {
        return 'Straße und Hausnummer zu lang';
    }

    return null;
}

router.post('/', async (req, res) => {
    try {
        const { type, data } = req.body;

        console.log(req.body);
        console.log(data);

        console.log('\n' + '═'.repeat(80));
        console.log('📝 NEW FORM SUBMISSION');
        console.log('═'.repeat(80));

        if (!type || !['service', 'contact'].includes(type)) {
            console.log('❌ Error: invalid form type:', type);
            return res.status(400).json({
                error: 'Invalid form type'
            });
        }

        console.log(`📌 Form Type: ${type === 'service' ? 'SERVICE' : 'CONTACT'}`);

        const requiredFields = ['name', 'lastname', 'email'];
        for (const field of requiredFields) {
            if (!data[field] || typeof data[field] !== 'string') {
                console.log(`❌ Error: field "${field}" is required`);
                return res.status(400).json({
                    error: `Field "${field}" is required`
                });
            }
        }

        const emailError = validateEmail(data.email);
        if (emailError) {
            console.log(`❌ Email validation error: ${emailError}`);
            return res.status(400).json({
                error: emailError
            });
        }

        console.log('\n👤 Contact Information:');
        console.log(`   Name: ${data.name}`);
        console.log(`   Last Name: ${data.lastname}`);
        console.log(`   Email: ${data.email}`);

        if (type === 'service') {
            const serviceFields = ['phone', 'street', 'postal_code', 'city', 'property_type', 'services'];
            for (const field of serviceFields) {
                if (!data[field]) {
                    console.log(`❌ Error: field "${field}" is required for service form`);
                    return res.status(400).json({
                        error: `Field "${field}" is required for service form`
                    });
                }
            }

            const phoneError = validatePhone(data.phone);
            if (phoneError) {
                console.log(`❌ Phone validation error: ${phoneError}`);
                return res.status(400).json({
                    error: phoneError
                });
            }

            const streetError = validateStreet(data.street);
            if (streetError) {
                console.log(`❌ Street validation error: ${streetError}`);
                return res.status(400).json({
                    error: streetError
                });
            }

            const postalCodeError = validatePostalCode(data.postal_code);
            if (postalCodeError) {
                console.log(`❌ Postal code validation error: ${postalCodeError}`);
                return res.status(400).json({
                    error: postalCodeError
                });
            }

            const cityError = validateCity(data.city);
            if (cityError) {
                console.log(`❌ City validation error: ${cityError}`);
                return res.status(400).json({
                    error: cityError
                });
            }

            console.log('\n📍 Address:');
            console.log(`   Street: ${data.street}`);
            console.log(`   Postal Code: ${data.postal_code}`);
            console.log(`   City: ${data.city}`);
            console.log(`   Property Type: ${data.property_type}`);

            console.log('\n☎️ Contact:');
            console.log(`   Phone: ${data.phone}`);

            console.log('\n🛠️ Services:');
            const serviceNames = {
                floor: 'Bodenreinigung',
                windows: 'Fensterreinigung',
                deep: 'Tiefenreinigung',
                kitchen: 'Küchenreinigung',
                bathroom: 'Badezimmerreinigung',
                carpet: 'Teppichreinigung'
            };

            if (Array.isArray(data.services)) {
                data.services.forEach(service => {
                    console.log(`   ✓ ${serviceNames[service] || service}`);
                });
            }

            if (data.requirements && data.requirements.length > 0) {
                console.log('\n⚙️ Requirements:');
                const reqNames = {
                    hypoallergenic: 'Hypoallergene Mittel',
                    eco: 'Eco-friendly',
                    pet_friendly: 'Haustiere anwesend'
                };
                data.requirements.forEach(req => {
                    console.log(`   ✓ ${reqNames[req] || req}`);
                });
            }

            if (data.booking && data.booking.date) {
                console.log('\n📅 Booking:');
                console.log(`   Date: ${data.booking.date}`);
                console.log(`   From: ${String(data.booking.timeFrom).padStart(2, '0')}:00`);
                console.log(`   To: ${String(data.booking.timeTo).padStart(2, '0')}:00`);
                console.log(`   Duration: ${data.booking.duration} hours`);

                const bookedHours = bookedSlots.get(data.booking.date) || [];
                for (let hour = data.booking.timeFrom; hour <= data.booking.timeTo; hour++) {
                    if (bookedHours.includes(hour)) {
                        console.log(`❌ Error: Time slot ${hour}:00 is already booked`);
                        return res.status(409).json({
                            error: `Time slot ${hour}:00 is already booked for this date`
                        });
                    }
                }

                const newBookedHours = [
                    ...bookedHours,
                    ...Array.from(
                        { length: data.booking.timeTo - data.booking.timeFrom + 1 },
                        (_, i) => data.booking.timeFrom + i
                    )
                ];
                bookedSlots.set(data.booking.date, newBookedHours);
                console.log(`✅ Booked hours recorded:`, newBookedHours);
            }
        }

        if (data.details) {
            console.log('\n📝 Additional Details:');
            console.log(`   ${data.details.substring(0, 100)}${data.details.length > 100 ? '...' : ''}`);
        }

        const formId = generateFormId();

        console.log('\n📧 Email Processing:');

        if (!transporter) {
            console.log('⚠️ Email transporter not configured. Skipping email sending.');
        } else {
            try {
                // const adminEmailContent = generateEmailContent(type, data);
                // await sendEmail(
                //     process.env.ADMIN_EMAIL || 'admin@example.com',
                //     `Neue ${type === 'service' ? 'Service' : 'Kontakt'} Anfrage - ${formId}`,
                //     adminEmailContent
                // );

                const adminEmailContent = generateEmailContent(type, data);
                const adminInfo = await sendEmail(
                    process.env.ADMIN_EMAIL || 'admin@example.com',
                    `Neue ${type === 'service' ? 'Service' : 'Kontakt'} Anfrage - ${formId}`,
                    adminEmailContent
                );

                const clientEmailContent = generateConfirmationEmail(type, data);
                const clientInfo = await sendEmail(
                    data.email,
                    'Anfrage bestätigt - Vielen Dank!',
                    clientEmailContent
                );

                console.log('✅ Emails sent successfully');
            } catch (emailError) {
                console.error('⚠️ Email sending failed:', emailError.message);
            }
        }

        console.log('\n' + '═'.repeat(80));
        console.log('✅ Form submission successful. Form ID:', formId);
        console.log('═'.repeat(80));
        console.log('');

        return res.status(200).json({
            success: true,
            message: `Anfrage erfolgreich empfangen. Sie erhalten eine Bestätigung per Email.`,
            formId: formId
        });

    } catch (error) {
        console.error('\n❌ FORM PROCESSING ERROR:');
        console.error(error.message);
        console.error('');

        return res.status(500).json({
            error: 'An error occurred while processing the form',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

async function sendEmail(to, subject, html) {
    try {
        console.log(`   📤 Sending email to ${to}...`);

        const info = await transporter.sendMail({
            from: process.env.MAIL_FROM || process.env.MAIL_USER || 'noreply@example.com',
            to,
            subject,
            html,
            text: stripHtml(html)
        });

        console.log(`   ✅ Email sent: ${info.messageId}`);

        if (info.response && info.response.includes('SMTP')) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`   🔗 Preview: ${previewUrl}`);
            }
        }

        return info;
    } catch (error) {
        console.error(`   ❌ Email sending failed: ${error.message}`);
        throw error;
    }
}

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
                    <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(data.street)}<br>${escapeHtml(data.postal_code)} ${escapeHtml(data.city)}<br></td>
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
                ${data.booking && data.booking.date ? `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Datum</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(data.booking.date)}</td>
                </tr>
                <tr style="background-color: #f5f5f5;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Uhrzeit</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${String(data.booking.timeFrom).padStart(2, '0')}:00 - ${String(data.booking.timeTo).padStart(2, '0')}:00</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Dauer</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${data.booking.duration} Stunde${data.booking.duration > 1 ? 'n' : ''}</td>
                </tr>
                ` : ''}
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

// ===== ГЕНЕРАЦИЯ ПОДТВЕРЖДАЮЩЕГО EMAIL ДЛЯ КЛИЕНТА =====
function generateConfirmationEmail(type, data) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #50c878;">Vielen Dank für Ihre Anfrage!</h2>
            <p>Lieber ${escapeHtml(data.name)},</p>
            <p>wir haben Ihre Anfrage erfolgreich erhalten und werden uns in Kürze mit Ihnen in Verbindung setzen.</p>
            
            ${type === 'service' && data.booking && data.booking.date ? `
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

// ===== УТИЛИТЫ =====
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"');
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
    try {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

function generateFormId() {
    return `FORM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

export default router;