'use strict';

let currentDate = new Date();
let selectedDate = null;
let selectedTimeFrom = null;
let selectedTimeTo = null;
let isLoadingSlots = false;

const BUSINESS_HOURS_START = 9;
const BUSINESS_HOURS_END = 18;
const MONTH_NAMES = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

function setCalendarLoading(
    isLoading
) {

    isLoadingSlots = isLoading;


    document
        .querySelectorAll('.day-btn')
        .forEach(btn => {

            btn.disabled = isLoading;
        });


    document
        .querySelectorAll('.time-slot')
        .forEach(slot => {

            slot.disabled = isLoading;
        });


    const prevBtn =
        document.getElementById(
            'prevMonth'
        );

    const nextBtn =
        document.getElementById(
            'nextMonth'
        );

    if(prevBtn) {

        prevBtn.disabled = isLoading;
    }

    if(nextBtn) {

        nextBtn.disabled = isLoading;
    }


    const calendar =
        document.getElementById(
            'booking-calendar'
        );

    if(calendar) {

        calendar.classList.toggle(
            'calendar-loading',
            isLoading
        );
    }
}

function renderCalendar() {
    console.log('🔄 Rendering calendar...');

    const calendarDays = document.getElementById('calendarDays');
    const currentMonthEl = document.getElementById('currentMonth');

    if (!calendarDays) {
        console.error('❌ #calendarDays not found!');
        return;
    }
    if (!currentMonthEl) {
        console.error('❌ #currentMonth not found!');
        return;
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    currentMonthEl.textContent =
        `${MONTH_NAMES[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const firstDayWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const lastDayDate = lastDay.getDate();
    const prevLastDayDate = prevLastDay.getDate();

    calendarDays.innerHTML = '';

    for (let i = firstDayWeek - 1; i >= 0; i--) {
        const btn = createDayButton(prevLastDayDate - i, 'other-month', true);
        calendarDays.appendChild(btn);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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

    console.log('✅ Calendar rendered successfully');
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
function resetTimeSelection() {

    selectedTimeFrom = null;

    selectedTimeTo = null;

    document
        .querySelectorAll('.time-slot')
        .forEach(slot => {

            slot.classList.remove(
                'selected',
                'selected-to'
            );

            slot.style.opacity = '1';

            slot.style.pointerEvents =
                'auto';
        });

    document.getElementById(
        'timeFromDisplay'
    ).textContent = '--:--';

    document.getElementById(
        'timeToDisplay'
    ).textContent = '--:--';

    document.getElementById(
        'durationInfo'
    ).innerHTML = '';
}
function handleTimeSlotClick(
    hour,
    timeStr,
    slot
) {

    if (selectedTimeFrom === null) {

        selectTimeFrom(
            hour,
            timeStr,
            slot
        );

        return;
    }

    if (
        selectedTimeTo === null &&
        hour > selectedTimeFrom
    ) {

        selectTimeTo(
            hour,
            timeStr,
            slot
        );

        return;
    }

    resetTimeSelection();

    selectTimeFrom(
        hour,
        timeStr,
        slot
    );
}
async function renderTimeSlots() {
    const dateStr = selectedDate.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    if (isLoadingSlots) return;

    setCalendarLoading(true);

    document.getElementById('selectedDateDisplay').innerHTML =
        `<i class="bi bi-calendar-event"></i> <span>${dateStr}</span>`;

    const dateFormatted = selectedDate.toISOString().split('T')[0];
    try {
        const response = await fetch(`http://localhost:3000/booked-slots?date=${dateFormatted}`);
        if (response.ok) {
            const data = await response.json();
            window.bookedHours = data.bookedHours || [];
            console.log(`📅 Reserved time slot on ${dateFormatted}:`, window.bookedHours);
        }
    } catch (error) {
        console.warn('⚠️ Failed to load reserved hours:', error.message);
        window.bookedHours = [];
    } finally {
        setCalendarLoading(false);
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
    resetTimeSelection();
    setCalendarLoading(false);
}

function createTimeSlot(hour, timeStr) {

    const slot = document.createElement('button');

    slot.type = 'button';

    slot.className = 'time-slot';

    slot.textContent = timeStr;

    slot.dataset.hour = hour;

    const bookedHours =
        window.bookedHours || [];

    if (bookedHours.includes(hour)) {

        slot.classList.add('booked');

        slot.disabled = true;

    } else {

        slot.addEventListener(
            'click',
            () => handleTimeSlotClick(
                hour,
                timeStr,
                slot
            )
        );
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

    document
        .querySelectorAll('.time-slot')
        .forEach(slot => {

            const hour =
                parseInt(
                    slot.dataset.hour
                );

            if (hour <= selectedTimeFrom) {

                slot.style.opacity = '0.5';

            } else {

                slot.style.opacity = '1';
            }
        });
}

function selectTimeTo(
    hour,
    timeStr,
    slot
) {

    selectedTimeTo = hour;

    document
        .querySelectorAll('.time-slot')
        .forEach(slot => {

            slot.classList.remove(
                'selected-to'
            );
        });

    slot.classList.add(
        'selected-to'
    );

    document.getElementById(
        'timeToDisplay'
    ).textContent = timeStr;

    const duration =
        selectedTimeTo -
        selectedTimeFrom;

    document.getElementById(
        'durationInfo'
    ).innerHTML = `

        <strong>
            ${duration}
            Stunde${duration > 1 ? 'n' : ''}
        </strong>

        ausgewählt
    `;

    const bookingEvent =
        new CustomEvent(
            'bookingTimeSelected',
            {
                detail: {
                    date:
                        selectedDate
                            .toISOString()
                            .split('T')[0],

                    timeFrom:
                        selectedTimeFrom,

                    timeTo:
                        selectedTimeTo,

                    duration
                }
            }
        );

    document.dispatchEvent(
        bookingEvent
    );
}

function setupCalendarNavigation() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            selectedDate = null;
            selectedTimeFrom = null;
            selectedTimeTo = null;
            document.getElementById('slotsContainer').style.display = 'none';
            document.getElementById('placeholderMessage').style.display = 'block';
            renderCalendar();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            selectedDate = null;
            selectedTimeFrom = null;
            selectedTimeTo = null;
            document.getElementById('slotsContainer').style.display = 'none';
            document.getElementById('placeholderMessage').style.display = 'block';
            renderCalendar();
        });
    }
}

function initBooking() {
    console.log('✅ Booking script loaded');

    setTimeout(() => {
        renderCalendar();
        setupCalendarNavigation();
    }, 100);
}

// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initBooking);
// } else {
//     initBooking();
// }
export {
    initBooking
};