"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Box, Button, Stack, Divider, Typography, Menu } from '@mui/material';
import EditEvent from "./edit_event";

interface DayProps {
    date: Date;
    setDate: React.Dispatch<React.SetStateAction<Date>>;
}

const timeBlockCount = 25;

interface Event {
    id: number;
    title: string;
    startDateTime: Date;
    tags: string[];
    endDateTime: Date;
    description: string;
}

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const DayComponent: React.FC<DayProps> = ({date, setDate}) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [isEditingEvent, setIsEditingEvent] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event>({
        id: -1,
        title: "",
        startDateTime: new Date(),
        tags: [],
        endDateTime: new Date(),
        description: "",
    });
    const [eventEditAnchor, setEventCreationAnchor] = useState<null | HTMLElement>(null);
    const [widthOffset, setWidthOffset] = useState(0);
    const widthOffsetRef = useRef<HTMLHRElement>(null);
    const componentRef = useRef<HTMLDivElement>(null);

    const calculateWidthOffset = () => {
        if (widthOffsetRef.current && componentRef.current) {
            const rect = widthOffsetRef.current.getBoundingClientRect();
            const componentRect = componentRef.current.getBoundingClientRect();
            setWidthOffset(rect.left - componentRect.left);
        }
    };

    useEffect(() => {
        
        calculateWidthOffset();
        window.addEventListener('resize', calculateWidthOffset);
        return () => {
            window.removeEventListener('resize', calculateWidthOffset);
        };
    }, []);

    useEffect(() => {
        fetch(`${server_base_url}/calendar/get_events?` +
            `start_datetime=${new Date(date.getFullYear(), date.getMonth(),
                date.getDate(), 0, 0, 0).toISOString()}` +
            `&end_datetime=${new Date(date.getFullYear(), date.getMonth(),
                date.getDate(), 23, 59, 59).toISOString()}`)
            .then(response => response.json())
            .then((data: {events: {id: number, title: string, start_datetime: string, 
                end_datetime: string, description: string}[]}) => {
                setEvents(data.events.map((event) => {
                    console.log(event);
                    return {
                        id: event.id,
                        title: event.title,
                        startDateTime: new Date(event.start_datetime),
                        endDateTime: new Date(event.end_datetime),
                        tags: ["Google Drive"],
                        description: event.description,
                    };
                }));
            });
    }, []);
    
    const updateEvents = (title: string, startDateTime: Date, 
        endDateTime: Date, description: string, id: number) => {
        if (id === -1) {
            let id: number;
            console.log("posting event: ", title, startDateTime, endDateTime, description);
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
                })
            }).then(response => response.json())
                .then((data: {id: number}) => {
                    id = data.id;
                }
            ).then(() => {
                setEvents([...events, {
                    id: id,
                    title: title,
                    startDateTime: startDateTime,
                    endDateTime: endDateTime,
                    tags: ["Google Drive"],
                    description: description,
                }]);
            });
        }
        else {
            setEvents(events.map((event, index) => {
                if (index === id) {
                    return {
                        id: id,
                        title: title,
                        startDateTime: startDateTime,
                        endDateTime: endDateTime,
                        tags: ["Google Drive"],
                        description: description,
                    };
                }
                return event;
            }));
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
                })
            });
        }
    }

    const constructNewEvent = (startDateTime: Date) => {
        return {
            id: -1,
            title: "new event",
            startDateTime: startDateTime,
            tags: [],
            endDateTime: new Date(startDateTime.getTime() + 60 * 60 * 1000),
            description: "",
        };
    }

    const handleTimeBlockClick = (event: Event,
        mouseEvent: React.MouseEvent<HTMLButtonElement>) => {
        setSelectedEvent(event);
        setIsEditingEvent(true);
        setEventCreationAnchor(mouseEvent.currentTarget);
    }
	return (
		<Stack 
        ref={componentRef}
        sx={{
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
            width: '100%',
            marginTop: '10px',
            position: 'relative',
        }}>
            {/* TODO: Implement smarter event placement */}
            <Box sx={{
                display: 'flex',
                alignItems: 'flex-start',
            }}>
                {events.map((event, index) => (
                    <div key={index}>
                    <Button
                    key={index}
                    onClick={(click_event) => { 
                        handleTimeBlockClick(event, click_event)}}
                    sx={{
                        marginTop: `${event.startDateTime.getHours() * 70 + 
                            event.startDateTime.getMinutes() * 1.2 + 37}px`,
                        marginLeft: `${widthOffset - 5}px`,
                        width: '88%',
                        height: `${(event.endDateTime.getTime() - 
                            event.startDateTime.getTime()) / 60000 * 1.2 - 4}px`,
                        backgroundColor: 'primary.main',
                        zIndex: 3,
                        position: 'absolute',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '10px',
                        opacity: 0.9,
                    }}>
                        <Typography sx={{ color: 'primary.contrastText', zIndex: 3}}>
                            {event.title}
                        </Typography>
                    </Button>
                    </div>
                ))}
            </Box>


			{Array.from({length: timeBlockCount}, (_, i) => (
                <Box key={i}
                sx={{ 
                    width: '100%', 
                    flexDirection: 'row', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent:'center' }}>
                    <Typography sx={{ paddingRight: "10px"}}>
                        {i}:00
                    </Typography>
                    <Box 
                    sx={{
                        flexDirection: 'column',
                        marginRight: '40px',
                        width: '87%',

                    }}>
                        <Divider key={i} 
                        ref={widthOffsetRef}
                        sx={{ 
                            backgroundColor: 'primary.contrastText', 
                            height: '1px',
                            width: '88%',
                            marginTop: '35px',
                            position: 'absolute',
                            zIndex: 2,
                        }} />

                        <Button variant='text'
                        onClick={(mouseEvent) => {handleTimeBlockClick(
                            constructNewEvent(new Date(date.getFullYear(), 
                                date.getMonth(), date.getDate(), i)),
                            mouseEvent)}}
                        sx={{
                            width: '100%',
                            height: '70px',
                        }}/>
                        <Menu
                            anchorEl={eventEditAnchor}
                            open={isEditingEvent}
                            onClose={() => setIsEditingEvent(false)}
                            MenuListProps={{ sx: { py: 0 } }}
                            >
                            <Box sx={{ width: '500px', height: '300px', 
                                backgroundColor: 'primary.light',
                                color: 'primary.contrastText',
                                }}>
                                <EditEvent 
                                    eventInfo={selectedEvent}
                                    updateEvent={updateEvents}
                                    closeCreateEvent={useCallback(() => 
                                        setIsEditingEvent(false), [])}
                                />
                            </Box>
                        </Menu>
                    </Box>
                </Box>
            ))}
        </Stack>
	);
};

export default DayComponent;