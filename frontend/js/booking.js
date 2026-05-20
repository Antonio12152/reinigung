let currentDate = new Date();
let selectedDate = null;
let selectedTimeFrom = null;
let selectedTimeTo = null;

const BUSINESS_HOURS_START = 9;
const BUSINESS_HOURS_END = 18;
const MONTH_NAMES = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    document.getElementById('currentMonth').textContent =
        `${MONTH_NAMES[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const firstDayWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const lastDayDate = lastDay.getDate();
    const prevLastDayDate = prevLastDay.getDate();

    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    for (let i = firstDayWeek - 1; i >= 0; i--) {
        const btn = createDayButton(prevLastDayDate - i, 'other-month', true);
        calendarDays.appendChild(btn);
    }

    const today = new Date();
    for (let day = 1; day <= lastDayDate; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const isPast = date < today && !isToday;

        const btn = createDayButton(day, 'current-month', isPast, isToday);

        if (!isPast) {
            btn.addEventListener('click', () => selectDate(date, btn));
        }

        calendarDays.appendChild(btn);
    }

    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const btn = createDayButton(day, 'other-month', true);
        calendarDays.appendChild(btn);
    }
}

function createDayButton(day, type, isDisabled = false, isToday = false) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day-btn';
    btn.textContent = day;

    if (isDisabled) btn.disabled = true;
    if (isToday) btn.classList.add('today');

    return btn;
}

function selectDate(date, btn) {
    selectedDate = date;
    selectedTimeFrom = null;
    selectedTimeTo = null;

    document.querySelectorAll('.day-btn').forEach(b => {
        b.classList.remove('selected');
    });
    btn.classList.add('selected');

    renderTimeSlots();
}

async function renderTimeSlots() {
    const dateStr = selectedDate.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('selectedDateDisplay').innerHTML =
        `<i class="bi bi-calendar-event"></i> <span>${dateStr}</span>`;

    const dateFormatted = selectedDate.toISOString().split('T')[0];
    try {
        const response = await fetch(`http://localhost:3000/booked-slots?date=${dateFormatted}`);
        if (response.ok) {
            const data = await response.json();
            window.bookedHours = data.bookedHours || [];
            console.log(`📅 Booked hours on ${dateFormatted}:`, window.bookedHours);
        }
    } catch (error) {
        console.warn('⚠️ Can\'t load booked hours:', error.message);
        window.bookedHours = [];
    }

    const grid = document.getElementById('timeSlotsGrid');
    grid.innerHTML = '';

    for (let hour = BUSINESS_HOURS_START; hour < BUSINESS_HOURS_END; hour++) {
        const timeStr = `${String(hour).padStart(2, '0')}:00`;
        const slot = createTimeSlot(hour, timeStr);
        grid.appendChild(slot);
    }

    document.getElementById('slotsContainer').style.display = 'block';
    document.getElementById('placeholderMessage').style.display = 'none';
}

function createTimeSlot(hour, timeStr) {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'time-slot';
    slot.textContent = timeStr;
    slot.dataset.hour = hour;

    const bookedHours = window.bookedHours || [];
    if (bookedHours.includes(hour)) {
        slot.classList.add('booked');
        slot.disabled = true;
    } else {
        slot.addEventListener('click', (e) => {
            e.preventDefault();
            selectTimeFrom(hour, timeStr, slot);
        });
    }

    return slot;
}

function selectTimeFrom(hour, timeStr, slot) {
    selectedTimeFrom = hour;
    selectedTimeTo = null;

    document.querySelectorAll('.time-slot').forEach(s => {
        s.classList.remove('selected');
    });

    slot.classList.add('selected');

    document.getElementById('timeFromDisplay').textContent = timeStr;
    document.getElementById('timeToDisplay').textContent = '--:--';

    updateAvailableToTimes();
}

function updateAvailableToTimes() {
    document.querySelectorAll('.time-slot').forEach(slot => {
        const hour = parseInt(slot.dataset.hour);

        if (hour <= selectedTimeFrom) {
            slot.style.opacity = '0.5';
            slot.style.pointerEvents = 'none';
        } else {
            slot.style.opacity = '1';
            slot.style.pointerEvents = 'auto';

            slot.removeEventListener('click', selectTimeToHandler);
            slot.addEventListener('click', selectTimeToHandler);
        }
    });
}

function selectTimeToHandler(e) {
    e.preventDefault();
    const hour = parseInt(this.dataset.hour);
    const timeStr = this.textContent;

    if (hour > selectedTimeFrom) {
        selectedTimeTo = hour;

        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });

        this.classList.add('selected');

        document.getElementById('timeToDisplay').textContent = timeStr;

        const duration = selectedTimeTo - selectedTimeFrom;
        document.getElementById('durationInfo').innerHTML =
            `<strong>${duration} Stunde${duration > 1 ? 'n' : ''}</strong> ausgewählt`;

        const bookingEvent = new CustomEvent('bookingTimeSelected', {
            detail: {
                date: selectedDate.toISOString().split('T')[0],
                timeFrom: selectedTimeFrom,
                timeTo: selectedTimeTo,
                duration: duration
            }
        });
        document.dispatchEvent(bookingEvent);
    }
}

document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    selectedDate = null;
    selectedTimeFrom = null;
    selectedTimeTo = null;
    document.getElementById('slotsContainer').style.display = 'none';
    document.getElementById('placeholderMessage').style.display = 'block';
    renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    selectedDate = null;
    selectedTimeFrom = null;
    selectedTimeTo = null;
    document.getElementById('slotsContainer').style.display = 'none';
    document.getElementById('placeholderMessage').style.display = 'block';
    renderCalendar();
});

renderCalendar();