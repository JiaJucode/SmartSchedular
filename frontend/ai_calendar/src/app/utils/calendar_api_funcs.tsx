import { start } from 'repl';
import { Event } from '../calendar/day';

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

export const fetchEvents = (startDateTime: Date, endDateTime: Date,
    setEvents: React.Dispatch<React.SetStateAction<Event[]>>) => {
    fetch(`${server_base_url}/calendar/get_events?` + 
        `start_datetime=${startDateTime.toISOString()}` + 
        `&end_datetime=${endDateTime.toISOString()}`)
    .then((response) => response.json())
    .then((data: {events: {id: number, title: string, start_datetime: string,
        end_datetime: string, description: string, tags: string[]}[]}) => {
        setEvents(data.events.map((event) => ({
            id: event.id,
            title: event.title,
            startDateTime: new Date(event.start_datetime),
            endDateTime: new Date(event.end_datetime),
            description: event.description,
            tags: event.tags ? event.tags : [],
        })));
    });
}

export const addEvent = (title: string, startDateTime: Date, endDateTime: Date,
    description: string, tags: string[], 
    setEvents: React.Dispatch<React.SetStateAction<Event[]>>) => {
    fetch(`${server_base_url}/calendar/add_event`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: title,
            start_datetime: startDateTime.toISOString(),
            end_datetime: endDateTime.toISOString(),
            description: description,
            tags: tags,
        }),
    }
    ).then((response) => response.json())
    .then((data: {id: number}) => {
        setEvents((prevEvents) => {
            return [...prevEvents, {
                id: data.id,
                title: title,
                startDateTime: startDateTime,
                endDateTime: endDateTime,
                description: description,
                tags: tags,
            }];
        });
    });
}

export const updateEvent = (title: string, startDateTime: Date, endDateTime: Date,
    description: string, tags: string[], id: number,
    setEvents: React.Dispatch<React.SetStateAction<Event[]>>) => {
    fetch(`${server_base_url}/calendar/edit_event`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: id,
            title: title,
            start_datetime: startDateTime.toISOString(),
            end_datetime: endDateTime.toISOString(),
            description: description,
            tags: tags,
        }),
    }
    ).then(() => {
        setEvents((prevEvents) => {
            return prevEvents.map((event) => {
                if (event.id === id) {
                    return {
                        id: id,
                        title: title,
                        startDateTime: startDateTime,
                        endDateTime: endDateTime,
                        description: description,
                        tags: tags,
                    };
                } else {
                    return event;
                }
            });
        });
    });
}

export const deleteEvent = (id: number, setEvents: React.Dispatch<React.SetStateAction<Event[]>>) => {
    fetch(`${server_base_url}/calendar/delete_event`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: id,
        }),
    }
    ).then(() => {
        setEvents((prevEvents) => {
            return prevEvents.filter((event) => event.id !== id);
        });
    });
}