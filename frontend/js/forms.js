const API_URL = 'http://localhost:3000/forms';

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

const forms = document.querySelectorAll('.custom-form');

forms.forEach(form => {
    form.addEventListener('submit', handleFormSubmit);
});

async function handleFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formType = form.dataset.formType;

    clearValidation(form);

    if (formType === 'service') {
        if (!bookingData.date || bookingData.timeFrom === null || bookingData.timeTo === null) {
            showErrors(form, ['⚠️ Пожалуйста, выберите дату и время в календаре']);
            return;
        }
    }

    const formData = new FormData(form);
    let data = Object.fromEntries(formData.entries());

    const selectedServices = Array.from(
        form.querySelectorAll('input[name="services"]:checked')
    ).map(el => el.value);

    data.services = selectedServices;

    const selectedRequirements = Array.from(
        form.querySelectorAll('input[name="requirements"]:checked')
    ).map(el => el.value);

    if (selectedRequirements.length > 0) {
        data.requirements = selectedRequirements;
    }

    const errors = validateForm(formType, data);

    if (errors.length > 0) {
        showErrors(form, errors);
        return;
    }

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

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: formType,
                data: data
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        showSuccess(form, result.message || 'Anfrage erfolgreich gesendet!');

        form.reset();
        if (formType === 'service') {
            bookingData = {
                date: null,
                timeFrom: null,
                timeTo: null,
                duration: null
            };
        }

        setTimeout(() => {
            if (formType === 'service') {
                const serviceFormSection = document.getElementById('service-form');
                if (serviceFormSection) {
                    serviceFormSection.classList.add('hidden');
                }
            }
        }, 2000);

    } catch (error) {
        console.error('Submit error:', error);
        showErrors(form, [
            error.message || 'Serverfehler bei der Anfrage'
        ]);
    }
}

function validateForm(type, data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
        errors.push('❌ Vorname ist erforderlich (mindestens 2 Zeichen)');
    }

    if (!data.lastname || data.lastname.trim().length < 2) {
        errors.push('❌ Nachname ist erforderlich (mindestens 2 Zeichen)');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        errors.push('❌ Ungültige Email-Adresse');
    }

    if (type === 'service') {
        if (!data.phone || data.phone.trim().length < 5) {
            errors.push('❌ Telefonnummer ist erforderlich');
        }

        if (!data.street || data.street.trim().length < 3) {
            errors.push('❌ Straße und Hausnummer sind erforderlich');
        }

        if (!data.postal_code || data.postal_code.trim().length < 3) {
            errors.push('❌ Postleitzahl ist erforderlich');
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

        if (!bookingData.date || bookingData.timeFrom === null || bookingData.timeTo === null) {
            errors.push('❌ Bitte wählen Sie ein Datum und eine Uhrzeit');
        }
    }

    return errors;
}

function showErrors(form, errors) {
    const feedback = form.querySelector('.form-feedback');
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
    const feedback = form.querySelector('.form-feedback');
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
    feedback.innerHTML = '';
}

function showServiceForm() {
    const serviceFormSection = document.getElementById('service-form');

    if (serviceFormSection) {
        serviceFormSection.classList.remove('hidden');
        serviceFormSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function getBookingData() {
    return {
        ...bookingData
    };
}

export {
    bookingData,
    getBookingData,
    showServiceForm,
    handleFormSubmit
};