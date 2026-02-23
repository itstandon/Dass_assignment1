/**
 * Utility functions for calendar integration
 */

// Helper: Format date for .ics files (YYYYMMDDTHHmmssZ)
const formatICSDate = (date) => {
    if (!date) return '';
    return new Date(date).toISOString().replace(/-|:|\.\d\d\d/g, "");
};

// Helper: Format date for Google/Outlook links (YYYYMMDDTHHmmssZ)
const formatLinkDate = (date) => {
    if (!date) return '';
    return new Date(date).toISOString().replace(/-|:|\.\d\d\d/g, "");
};

// 1. Generate Google Calendar Link
export const getGoogleCalendarLink = (event) => {
    const { title, description, startDate, endDate, location } = event;
    const start = formatLinkDate(startDate);
    const end = formatLinkDate(endDate);
    
    // Fallback if end date is missing (e.g. 1 hour duration)
    const finalEnd = end || formatLinkDate(new Date(new Date(startDate).getTime() + 60 * 60 * 1000));

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${start}/${finalEnd}`,
        details: description || '',
        location: location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// 2. Generate Outlook Calendar Link
export const getOutlookCalendarLink = (event) => {
    const { title, description, startDate, endDate, location } = event;
    const start = new Date(startDate).toISOString();
    const end = endDate ? new Date(endDate).toISOString() : new Date(new Date(startDate).getTime() + 60 * 60 * 1000).toISOString();

    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        startdt: start,
        enddt: end,
        subject: title,
        body: description || '',
        location: location || '',
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

// 3. Generate .ics file content (Single or Batch)
export const generateICSFile = (events) => {
    const eventArray = Array.isArray(events) ? events : [events];
    
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//EventManagementSystem//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
    ];

    eventArray.forEach(event => {
        const { title, description, startDate, endDate, location, _id } = event;
        const now = formatICSDate(new Date());
        const start = formatICSDate(startDate);
        const end = formatICSDate(endDate || new Date(new Date(startDate).getTime() + 60 * 60 * 1000));
        
        icsContent.push(
            'BEGIN:VEVENT',
            `UID:${_id || start}@eventmanagementsystem`,
            `DTSTAMP:${now}`,
            `DTSTART:${start}`,
            `DTEND:${end}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${(description || '').replace(/\n/g, '\\n')}`,
            `LOCATION:${location || ''}`,
            'STATUS:CONFIRMED',
            'BEGIN:VALARM',
            'TRIGGER:-PT30M',  // Reminder 30 mins before
            'ACTION:DISPLAY',
            'DESCRIPTION:Reminder',
            'END:VALARM',
            'END:VEVENT'
        );
    });

    icsContent.push('END:VCALENDAR');
    
    return icsContent.join('\r\n');
};

// 4. Trigger download of .ics file
export const downloadICS = (events, filename = 'event.ics') => {
    const content = generateICSFile(events);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
