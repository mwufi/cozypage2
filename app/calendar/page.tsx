'use client';

import { useEffect, useState, FormEvent } from 'react';
import CalendarEventsList, { CalendarEvent } from '@/components/CalendarEventsList';
import Link from 'next/link';

interface CalendarApiResponse {
    events?: CalendarEvent[];
    error?: string;
}
interface CreateEventApiResponse {
    message?: string;
    id?: string;
    summary?: string;
    htmlLink?: string;
    error?: string;
}

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const GOOGLE_LOGIN_URL = `${PYTHON_BACKEND_URL}/auth/google/login`;

export default function CalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [createEventError, setCreateEventError] = useState<string | null>(null);
    const [createEventSuccess, setCreateEventSuccess] = useState<string | null>(null);
    const [eventForm, setEventForm] = useState({
        summary: '',
        startDateTime: '',
        endDateTime: '',
        startDate: '',
        endDate: '',
        isAllDay: false,
        description: '',
        location: '',
        attendees: ''
    });

    async function fetchCalendarEvents() {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/calendar/events');
            if (response.status === 401) {
                setIsAuthenticated(false);
                setError('Authentication required for Calendar. Please login.');
                setIsLoading(false);
                return;
            }
            const data: CalendarApiResponse = await response.json();
            if (!response.ok) {
                setIsAuthenticated(false);
                throw new Error(data.error || `Error fetching events: ${response.status}`);
            }
            setEvents(data.events || []);
            setIsAuthenticated(true);
        } catch (err: any) {
            setError(err.message || 'Failed to load calendar events.');
            setIsAuthenticated(false);
        }
        setIsLoading(false);
    }

    useEffect(() => {
        if (isAuthenticated === null) {
            fetchCalendarEvents();
        } else if (isAuthenticated) {
            fetchCalendarEvents();
        }
    }, [isAuthenticated]);

    const handleEventFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setEventForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (name === 'isAllDay') {
            setEventForm(prev => ({
                ...prev,
                startDateTime: checked ? '' : prev.startDateTime,
                endDateTime: checked ? '' : prev.endDateTime,
                startDate: !checked ? '' : prev.startDate,
                endDate: !checked ? '' : prev.endDate
            }));
        }
    };

    const handleCreateEvent = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsCreatingEvent(true);
        setCreateEventError(null);
        setCreateEventSuccess(null);

        const payload = {
            summary: eventForm.summary,
            start: eventForm.isAllDay ? { date: eventForm.startDate } : { dateTime: new Date(eventForm.startDateTime).toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            end: eventForm.isAllDay ? { date: eventForm.endDate } : { dateTime: new Date(eventForm.endDateTime).toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            description: eventForm.description || undefined,
            location: eventForm.location || undefined,
            attendees: eventForm.attendees ? eventForm.attendees.split(',').map(email => ({ email: email.trim() })) : undefined,
        };

        if (!payload.summary) { setCreateEventError("Summary is required."); setIsCreatingEvent(false); return; }
        if ((!payload.start.date && !payload.start.dateTime) || (!payload.end.date && !payload.end.dateTime)) {
            setCreateEventError("Valid start and end date/time are required.");
            setIsCreatingEvent(false);
            return;
        }

        try {
            const response = await fetch('/api/calendar/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data: CreateEventApiResponse = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `Error creating event: ${response.status}`);
            }
            setCreateEventSuccess(data.message || 'Event created!');
            setEventForm({
                summary: '', startDateTime: '', endDateTime: '', startDate: '', endDate: '',
                isAllDay: false, description: '', location: '', attendees: ''
            });
            setShowCreateModal(false);
            fetchCalendarEvents();
        } catch (err: any) {
            setCreateEventError(err.message || 'Could not create event.');
        }
        setIsCreatingEvent(false);
    };

    if (isLoading || isAuthenticated === null) {
        return (
            <div className="flex justify-center items-center h-screen"><p className="text-lg">Loading Calendar...</p></div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col justify-center items-center h-screen p-4">
                <p className="text-red-500 text-lg mb-4">
                    {error || 'You are not authorized to view the calendar. Please login.'}
                </p>
                <a href={GOOGLE_LOGIN_URL} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold shadow-md">
                    Login with Google
                </a>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 text-gray-100 bg-gray-800 min-h-screen">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
                <h1 className="text-4xl font-bold text-white">Your Week Ahead</h1>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => { setShowCreateModal(true); setCreateEventError(null); setCreateEventSuccess(null); }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
                    >
                        Create Event
                    </button>
                    <Link href="/api/auth/logout" legacyBehavior>
                        <a className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md">Logout</a>
                    </Link>
                </div>
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50 overflow-y-auto">
                    <div className="bg-gray-700 p-6 rounded-lg shadow-2xl w-full max-w-xl relative max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-semibold text-blue-300 mb-5">New Calendar Event</h2>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label htmlFor="summary" className="block text-sm font-medium text-gray-300 mb-1">Summary:</label>
                                <input type="text" name="summary" id="summary" required value={eventForm.summary} onChange={handleEventFormChange} className="w-full p-2 rounded bg-gray-600 text-gray-100 border border-gray-500 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" name="isAllDay" id="isAllDay" checked={eventForm.isAllDay} onChange={handleEventFormChange} className="h-4 w-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500" />
                                <label htmlFor="isAllDay" className="ml-2 block text-sm text-gray-300">All-day event</label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor={eventForm.isAllDay ? 'startDate' : 'startDateTime'} className="block text-sm font-medium text-gray-300 mb-1">Start:</label>
                                    {eventForm.isAllDay ? (
                                        <input type="date" name="startDate" id="startDate" required={eventForm.isAllDay} value={eventForm.startDate} onChange={handleEventFormChange} className="w-full p-2 rounded bg-gray-600 text-gray-100 border border-gray-500 focus:ring-blue-500 focus:border-blue-500" />
                                    ) : (
                                        <input type="datetime-local" name="startDateTime" id="startDateTime" required={!eventForm.isAllDay} value={eventForm.startDateTime} onChange={handleEventFormChange} className="w-full p-2 rounded bg-gray-600 text-gray-100 border border-gray-500 focus:ring-blue-500 focus:border-blue-500" />
                                    )}
                                </div>
                                <div>
                                    <label htmlFor={eventForm.isAllDay ? 'endDate' : 'endDateTime'} className="block text-sm font-medium text-gray-300 mb-1">End:</label>
                                    {eventForm.isAllDay ? (
                                        <input type="date" name="endDate" id="endDate" required={eventForm.isAllDay} value={eventForm.endDate} onChange={handleEventFormChange} className="w-full p-2 rounded bg-gray-600 text-gray-100 border border-gray-500 focus:ring-blue-500 focus:border-blue-500" />
                                    ) : (
                                        <input type="datetime-local" name="endDateTime" id="endDateTime" required={!eventForm.isAllDay} value={eventForm.endDateTime} onChange={handleEventFormChange} className="w-full p-2 rounded bg-gray-600 text-gray-100 border border-gray-500 focus:ring-blue-500 focus:border-blue-500" />
                                    )}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description:</label>
                                <textarea name="description" id="description" rows={3} value={eventForm.description} onChange={handleEventFormChange} className="w-full p-2 rounded bg-gray-600 text-gray-100 border border-gray-500 focus:ring-blue-500 focus:border-blue-500"></textarea>
                            </div>
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">Location:</label>
                                <input type="text" name="location" id="location" value={eventForm.location} onChange={handleEventFormChange} className="w-full p-2 rounded bg-gray-600 text-gray-100 border border-gray-500 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label htmlFor="attendees" className="block text-sm font-medium text-gray-300 mb-1">Attendees (comma-separated emails):</label>
                                <input type="text" name="attendees" id="attendees" value={eventForm.attendees} onChange={handleEventFormChange} className="w-full p-2 rounded bg-gray-600 text-gray-100 border border-gray-500 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            {createEventError && <p className="text-sm text-red-400">Error: {createEventError}</p>}
                            <div className="flex justify-end space-x-3 pt-3">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-400 text-white transition-colors">Cancel</button>
                                <button type="submit" disabled={isCreatingEvent} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:bg-gray-400">
                                    {isCreatingEvent ? 'Creating Event...' : 'Create Event'}
                                </button>
                            </div>
                        </form>
                        <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 text-2xl">&times;</button>
                    </div>
                </div>
            )}

            {createEventSuccess && (
                <div className="bg-green-700 border border-green-900 text-white px-4 py-3 rounded relative mb-4 shadow-lg" role="alert">
                    <strong className="font-bold">Success: </strong>
                    <span className="block sm:inline" dangerouslySetInnerHTML={{ __html: createEventSuccess }}></span>
                </div>
            )}

            {error && isAuthenticated && (
                <div className="bg-red-700 border border-red-900 text-white px-4 py-3 rounded relative mb-4 shadow-lg" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center items-center h-64"><p className="text-lg text-gray-400">Fetching events...</p></div>
            ) : (
                <CalendarEventsList events={events} />
            )
            }
        </div>
    );
} 