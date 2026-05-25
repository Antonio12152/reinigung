import express from 'express';

const router = express.Router();

// router.get('/booked-slots', (req, res) => {
//     const { date } = req.query;

//     if (!date) {
//         return res.status(400).json({
//             error: 'Date parameter is required'
//         });
//     }

//     const bookedHours = [];

//     console.log(`\n📅 GET /booked-slots?date=${date}`);
//     console.log(`   Занятые часы: ${bookedHours.length > 0 ? bookedHours.join(', ') : 'нет'}`);

//     res.json({
//         date,
//         bookedHours,
//         message: `Booked hours for ${date}`
//     });
// });

router.post('/', async (req, res) => {
    try {
        const { type, data } = req.body;

        console.log('\n' + '═'.repeat(80));
        console.log('📝 NEW FORM SUBMISSION');
        console.log('═'.repeat(80));

        if (!type || !['service', 'contact'].includes(type)) {
            console.log('❌ Error: invalid form type:', type);
            return res.status(400).json({
                error: 'Invalid form type'
            });
        }

        console.log(`📌 Form Type: ${type === 'service' ? 'SERVICE (Order Service)' : 'CONTACT (Contact Form)'}`);

        const requiredFields = ['name', 'lastname', 'email'];
        for (const field of requiredFields) {
            if (!data[field] || typeof data[field] !== 'string') {
                console.log(`❌ Error: field "${field}" is required`);
                return res.status(400).json({
                    error: `Field "${field}" is required`
                });
            }
        }

        console.log('\n👤 Contact Information:');
        console.log(`   Name: ${data.name}`);
        console.log(`   Last Name: ${data.lastname}`);
        console.log(`   Email: ${data.email}`);

        if (type === 'service') {
            const serviceFields = ['phone', 'street', 'postal_code', 'property_type', 'services'];
            for (const field of serviceFields) {
                if (!data[field]) {
                    console.log(`❌ Error: field "${field}" is required for service form`);
                    return res.status(400).json({
                        error: `Field "${field}" is required for service form`
                    });
                }
            }

            console.log('\n📍 Address:');
            console.log(`   Street: ${data.street}`);
            console.log(`   City and Postal Code: ${data.postal_code}`);
            if (data.city) console.log(`   City: ${data.city}`);
            console.log(`   Property Type: ${data.property_type}`);

            console.log('\n☎️ Contact Information:');
            console.log(`   Phone: ${data.phone}`);

            console.log('\n🛠️ Services:');
            const serviceNames = {
                floor: 'Bodenreinigung (Чистка полов)',
                windows: 'Fensterreinigung (Чистка окон)',
                deep: 'Tiefenreinigung (Глубокая чистка)',
                kitchen: 'Küchenreinigung (Чистка кухни)',
                bathroom: 'Badezimmerreinigung (Чистка ванной)',
                carpet: 'Teppichreinigung (Чистка ковров)'
            };

            if (Array.isArray(data.services)) {
                data.services.forEach(service => {
                    console.log(`   ✓ ${serviceNames[service] || service}`);
                });
            }

            if (data.requirements && data.requirements.length > 0) {
                console.log('\n⚙️ Requirements:');
                const reqNames = {
                    hypoallergenic: 'Hypoallergene (Гипоаллергенные средства)',
                    eco: 'Eco-friendly (Экологичные продукты)',
                    pet_friendly: 'Pet-friendly (Есть животные)'
                };
                data.requirements.forEach(req => {
                    console.log(`   ✓ ${reqNames[req] || req}`);
                });
            }
        }

        if (data.details && data.details.trim()) {
            console.log('\n📝 Other Information:');
            console.log(`   ${data.details}`);
        }

        const formId = generateFormId();

        console.log('\n' + '═'.repeat(80));
        console.log('✅ Submission successful. Form ID:', formId);
        console.log('═'.repeat(80));

        console.log('\n📧 MAIL (NOT SENT — LOGGING ONLY):');
        console.log(`   → Admin: ${process.env.ADMIN_EMAIL || 'admin@example.com'}`);
        console.log(`   → Client: ${data.email}`);
        console.log(`\n🎫 ID form: ${formId}`);
        console.log('');

        return res.status(200).json({
            success: true,
            message: `Anfrage erfolgreich empfangen. Sie erhalten eine Bestätigung per Email.`,
            formId: formId,
            note: '🧪 TEST MODE: Emails not sent'
        });

    } catch (error) {
        console.error('\n❌ ERROR PROCESSING FORM:');
        console.error(error.message);
        console.error('');

        return res.status(500).json({
            error: 'An error occurred while processing the form',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

function generateFormId() {
    return `FORM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

export default router;