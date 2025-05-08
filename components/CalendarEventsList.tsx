'use client';

import React from 'react';

export interface CalendarEvent {
    id: string;
    summary: string;
    start: string; // ISO date string or just date for all-day
    end: string;   // ISO date string or just date for all-day
    location?: string;
    description?: string;
    htmlLink?: string;
}

interface CalendarEventsListProps {
    events: CalendarEvent[];
}

const formatEventDateTime = (dateTimeStr: string) => {
    try {
        const date = new Date(dateTimeStr);
        // Check if it's an all-day event (time part will be 00:00:00 or not present for date-only strings)
        if (dateTimeStr.length <= 10) { // Likely a YYYY-MM-DD date
            return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }); // Ensure UTC for date-only
        }
        return date.toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    } catch (e) {
        return dateTimeStr;
    }
};

const CalendarEventsList: React.FC<CalendarEventsListProps> = ({ events }) => {
    if (!events || events.length === 0) {
        return <p className="text-center text-gray-400 py-8">No events scheduled for this week.</p>;
    }

    // Group events by day
    const eventsByDay: { [key: string]: CalendarEvent[] } = events.reduce((acc, event) => {
        const startDate = new Date(event.start).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (!acc[startDate]) {
            acc[startDate] = [];
        }
        acc[startDate].push(event);
        return acc;
    }, {} as { [key: string]: CalendarEvent[] });

    return (
        <div className="space-y-6">
            {Object.entries(eventsByDay).map(([day, dayEvents]) => (
                <div key={day} className="mb-8">
                    <h2 className="text-2xl font-semibold text-blue-300 mb-4 pb-2 border-b border-gray-600">
                        {day}
                    </h2>
                    <div className="space-y-4">
                        {dayEvents.map((event) => (
                            <div
                                key={event.id}
                                className="bg-gray-700 p-4 md:p-5 rounded-lg shadow-lg hover:bg-gray-650 transition-all duration-200 border border-gray-600"
                            >
                                <h3 className="text-xl font-medium text-teal-300 mb-1">
                                    {event.summary}
                                </h3>
                                <p className="text-sm text-gray-300">
                                    {formatEventDateTime(event.start)} - {formatEventDateTime(event.end)}
                                </p>
                                {event.location && (
                                    <p className="text-sm text-gray-400 mt-1">Location: {event.location}</p>
                                )}
                                {event.description && (
                                    <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap line-clamp-3">
                                        {event.description}
                                    </p>
                                )}
                                {event.htmlLink && (
                                    <div className="mt-3">
                                        <a
                                            href={event.htmlLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                                        >
                                            View on Google Calendar
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CalendarEventsList; 