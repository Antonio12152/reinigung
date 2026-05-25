const API_URL = 'http://localhost:3000/forms';

console.log('📋 Forms.js loaded');
/*
let bookingData = {
    date: null,
    timeFrom: null,
    timeTo: null,
    duration: null
};

document.addEventListener('bookingTimeSelected', (e) => {
    bookingData = e.detail;
    console.log('📅 Booking data updated:', bookingData);
    showServiceForm();
});
*/

function initForms() {
    console.log('🔧 Initializing forms...');

    const forms = document.querySelectorAll('.custom-form');
    console.log(`✅ Found ${forms.length} forms`);

    forms.forEach((form, index) => {
        const formType = form.dataset.formType;
        console.log(`📝 Form ${index + 1}: type="${formType}"`);

        form.addEventListener('submit', handleFormSubmit);
        addRealtimeValidation(form);
    });

    console.log('✅ Forms initialized');
}

function addRealtimeValidation(form) {
    const formType = form.dataset.formType;

    // Общие поля для всех форм
    const nameInput = form.querySelector('input[name="name"]');
    const lastnameInput = form.querySelector('input[name="lastname"]');
    const emailInput = form.querySelector('input[name="email"]');

    if (nameInput) {
        nameInput.addEventListener('blur', (e) => {
            const error = validateName(e.target.value);
            showFieldError(e.target, error);
        });
    }

    if (lastnameInput) {
        lastnameInput.addEventListener('blur', (e) => {
            const error = validateLastname(e.target.value);
            showFieldError(e.target, error);
        });
    }

    if (emailInput) {
        emailInput.addEventListener('blur', (e) => {
            const error = validateEmail(e.target.value);
            showFieldError(e.target, error);
        });
    }

    if (formType === 'service') {
        const postalCodeInput = form.querySelector('input[name="postal_code"]');
        const cityInput = form.querySelector('input[name="city"]');
        const phoneInput = form.querySelector('input[name="phone"]');

        if (postalCodeInput) {
            postalCodeInput.addEventListener('blur', (e) => {
                const error = validatePostalCode(e.target.value);
                showFieldError(e.target, error);
            });

            postalCodeInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
            });
        }

        if (cityInput) {
            cityInput.addEventListener('blur', (e) => {
                const error = validateCity(e.target.value);
                showFieldError(e.target, error);
            });

            cityInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[0-9]/g, '');
            });
        }

        if (phoneInput) {
            phoneInput.addEventListener('blur', (e) => {
                const error = validatePhone(e.target.value);
                showFieldError(e.target, error);
            });
        }
    }

    /*
if (!bookingData.date || bookingData.timeFrom === null || bookingData.timeTo === null) {
    errors.push('❌ Bitte wählen Sie ein Datum und eine Uhrzeit');
}
*/
}

function showFieldError(field, error) {
    field.classList.remove('is-invalid');
    const existingHint = field.nextElementSibling;
    if (existingHint && existingHint.classList.contains('invalid-feedback-inline')) {
        existingHint.remove();
    }

    if (error) {
        field.classList.add('is-invalid');
        const hint = document.createElement('small');
        hint.className = 'invalid-feedback-inline d-block mt-1';
        hint.style.color = 'var(--danger)';
        hint.textContent = error;
        field.parentNode.insertBefore(hint, field.nextSibling);
    }
}

function validateName(value) {
    if (!value) {
        return 'Vorname ist erforderlich';
    }

    const trimmed = String(value).trim();

    if (trimmed.length < 2) {
        return 'Vorname muss mindestens 2 Zeichen haben';
    }

    if (trimmed.length > 50) {
        return 'Vorname darf nicht länger als 50 Zeichen sein';
    }

    return null;
}

function validateLastname(value) {
    if (!value) {
        return 'Nachname ist erforderlich';
    }

    const trimmed = String(value).trim();

    if (trimmed.length < 2) {
        return 'Nachname muss mindestens 2 Zeichen haben';
    }

    if (trimmed.length > 50) {
        return 'Nachname darf nicht länger als 50 Zeichen sein';
    }

    return null;
}

function validateEmail(value) {
    if (!value) {
        return 'Email ist erforderlich';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        return 'Ungültige Email-Adresse';
    }

    return null;
}

function validatePostalCode(value) {
    if (!value) {
        return 'Postleitzahl ist erforderlich';
    }

    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length !== 5) {
        return 'Postleitzahl muss 5 Ziffern haben';
    }

    const numValue = parseInt(cleaned);
    if (numValue < 1001 || numValue > 99999) {
        return 'Ungültige Postleitzahl';
    }

    return null;
}

function validateCity(value) {
    if (!value) {
        return 'Stadt ist erforderlich';
    }

    if (value.length < 2) {
        return 'Stadtnamen muss mindestens 2 Zeichen haben';
    }

    if (value.length > 50) {
        return 'Stadtnamen darf nicht länger als 50 Zeichen sein';
    }

    if (!/^[a-zA-ZäöüßÄÖÜ\s\-]+$/.test(value)) {
        return 'Stadtnamen darf nur Buchstaben, Leerzeichen und Bindestriche enthalten';
    }

    return null;
}

function validatePhone(value) {
    if (!value) {
        return 'Telefonnummer ist erforderlich';
    }

    if (value.length < 5) {
        return 'Telefonnummer zu kurz';
    }

    if (value.length > 20) {
        return 'Telefonnummer zu lang';
    }

    if (!/^[\d\s\+\-\(\)]+$/.test(value)) {
        return 'Ungültige Telefonnummer';
    }

    return null;
}

async function handleFormSubmit(e) {
    e.preventDefault();

    console.log('🚀 Form submit intercepted');

    const form = e.target;
    const formType = form.dataset.formType;

    console.log(`📌 Form Type: ${formType}`);

    clearValidation(form);

    const formData = new FormData(form);
    let data = Object.fromEntries(formData.entries());

    console.log('📦 Form Data before processing:', data);

    if (formType === 'service') {
        const selectedServices = Array.from(
            form.querySelectorAll('input[name="services"]:checked')
        ).map(el => el.value);

        data.services = selectedServices;
        console.log('🛠️ Selected Services:', selectedServices);

        const selectedRequirements = Array.from(
            form.querySelectorAll('input[name="requirements"]:checked')
        ).map(el => el.value);

        if (selectedRequirements.length > 0) {
            data.requirements = selectedRequirements;
            console.log('⚙️ Requirements:', selectedRequirements);
        }
    }

    const errors = validateForm(formType, data);

    if (errors.length > 0) {
        console.warn('❌ Validation errors:', errors);
        showErrors(form, errors);
        return;
    }

    console.log('✅ Validation passed');
    console.log('📤 Sending data to server:', JSON.stringify({ type: formType, data }, null, 2));
    /*
    if (formType === 'service') {
        data = {
            ...data,
            booking: {
                date: bookingData.date,
                timeFrom: bookingData.timeFrom,
                timeTo: bookingData.timeTo,
                duration: bookingData.duration
            }
        };
    }
    */
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: formType,
                data: data
            })
        });

        console.log(`📊 Response status: ${response.status}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Server response:', result);

        showSuccess(form, result.message || 'Anfrage erfolgreich gesendet!');

        form.reset();

    } catch (error) {
        console.error('❌ Submit error:', error);
        showErrors(form, [
            error.message || 'Serverfehler bei der Anfrage'
        ]);
    }
}

function validateForm(type, data) {
    const errors = [];

    const nameError = validateName(data.name);
    if (nameError) {
        errors.push('❌ ' + nameError);
    }

    const lastnameError = validateLastname(data.lastname);
    if (lastnameError) {
        errors.push('❌ ' + lastnameError);
    }

    const emailError = validateEmail(data.email);
    if (emailError) {
        errors.push('❌ ' + emailError);
    }

    if (type === 'contact') {
        if (data.message && data.message.trim().length > 5000) {
            errors.push('❌ Nachricht darf nicht länger als 5000 Zeichen sein');
        }
    }

    if (type === 'service') {
        const phoneError = validatePhone(data.phone);
        if (phoneError) {
            errors.push('❌ ' + phoneError);
        }

        if (!data.street || data.street.trim().length < 3) {
            errors.push('❌ Straße und Hausnummer sind erforderlich');
        }

        const postalCodeError = validatePostalCode(data.postal_code);
        if (postalCodeError) {
            errors.push('❌ ' + postalCodeError);
        }

        const cityError = validateCity(data.city);
        if (cityError) {
            errors.push('❌ ' + cityError);
        }

        if (!data.property_type) {
            errors.push('❌ Bitte wählen Sie einen Wohnungstyp');
        }

        const selectedServices = data.services || [];
        if (selectedServices.length === 0) {
            errors.push('❌ Bitte wählen Sie mindestens einen Service');
        }

        if (!data.terms) {
            errors.push('❌ Sie müssen den Datenschutzerklärung akzeptieren');
        }
    }

    return errors;
}

function showErrors(form, errors) {
    console.log('🚨 Showing errors:', errors);

    const feedback = form.querySelector('.form-feedback');
    if (!feedback) {
        console.error('❌ .form-feedback not found in form');
        return;
    }

    feedback.innerHTML = '';
    feedback.setAttribute('role', 'alert');

    errors.forEach(error => {
        const div = document.createElement('div');
        div.className = 'alert alert-danger alert-dismissible fade show';
        div.setAttribute('role', 'alert');
        div.innerHTML = `
            ${error}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        feedback.appendChild(div);
    });

    feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showSuccess(form, message) {
    console.log('🎉 Showing success:', message);

    const feedback = form.querySelector('.form-feedback');
    if (!feedback) {
        console.error('❌ .form-feedback not found in form');
        return;
    }

    feedback.innerHTML = '';

    const div = document.createElement('div');
    div.className = 'alert alert-success alert-dismissible fade show';
    div.setAttribute('role', 'alert');
    div.innerHTML = `
        <i class="bi bi-check-circle"></i> <strong>${message}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    feedback.appendChild(div);

    feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearValidation(form) {
    const feedback = form.querySelector('.form-feedback');
    if (feedback) {
        feedback.innerHTML = '';
    }

    const fields = form.querySelectorAll('.is-invalid');
    fields.forEach(field => {
        field.classList.remove('is-invalid');
        const hint = field.nextElementSibling;
        if (hint && hint.classList.contains('invalid-feedback-inline')) {
            hint.remove();
        }
    });
}
/*
function showServiceForm() {
    const serviceFormSection = document.getElementById('service-form');

    if (serviceFormSection) {
        serviceFormSection.classList.remove('hidden');
        serviceFormSection.scrollIntoView({ behavior: 'smooth' });
    }
}
*/

/*
function getBookingData() {
    return {
        ...bookingData
    };
}
*/
console.log('📋 Forms.js ready for import');

export {
    initForms,
    handleFormSubmit,
    // bookingData,
    // getBookingData, 
    // showServiceForm,
};