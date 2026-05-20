const API_URL = 'http://localhost:3000/forms';

const forms = document.querySelectorAll('.custom-form');

forms.forEach(form => {
    form.addEventListener('submit', handleFormSubmit);
});

async function handleFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    clearValidation(form);

    const formType = form.dataset.formType;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const errors = validateForm(formType, data);
    if (errors.length > 0) {
        showErrors(form, errors);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: formType, data })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        showSuccess(form, result.message);
        form.reset();

    } catch (error) {
        showErrors(form, [
            error.message || 'Serverfehler'
        ]);
    }
}

function validateForm(type, data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
        errors.push('Vorname ist erforderlich');
    }

    if (!data.lastname || data.lastname.trim().length < 2) {
        errors.push('Nachname ist erforderlich');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        errors.push('Ungültige Email-Adresse');
    }

    if (type === 'service') {
        const form = document.querySelector('[data-form-type="service"]');
        const selectedServices = Array.from(
            form.querySelectorAll('input[name="services"]:checked')
        ).map(el => el.value);

        if (selectedServices.length === 0) {
            errors.push('Bitte wählen Sie mindestens einen Service');
        }

        data.services = selectedServices;
    }

    return errors;
}
function showErrors(form, errors) {
    const feedback = form.querySelector('.form-feedback');
    feedback.innerHTML = '';
    feedback.setAttribute('role', 'alert');

    errors.forEach(error => {
        const div = document.createElement('div');
        div.className = 'alert alert-danger';
        div.textContent = error;
        feedback.appendChild(div);
    });
}

function showSuccess(form, message) {
    const feedback = form.querySelector('.form-feedback');
    const div = document.createElement('div');
    div.className = 'alert alert-success';
    div.textContent = message;
    feedback.innerHTML = '';
    feedback.appendChild(div);
}

function clearValidation(form) {
    const feedback = form.querySelector('.form-feedback');
    feedback.innerHTML = '';
}