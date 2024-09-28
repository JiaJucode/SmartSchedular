"use client";

import React, { useRef, useEffect, useState } from "react";
import { Box, Button, Stack, Divider, Typography, Menu } from '@mui/material';
import CreateEvent from "./create_event";

interface DayProps {
    date: Date;
    setDate: React.Dispatch<React.SetStateAction<Date>>;
}

const timeBlockCount = 25;

interface Event {
    title: string;
    startDateTime: Date;
    Tags: string[];
    endDateTime: Date;
    description: string;
}

const exampleEvents: Event[] = [
    {
        title: "Event 1",
        startDateTime: new Date(2024, 9, 27, 9),
        endDateTime: new Date(2024, 9, 27, 10),
        Tags: ["Google Drive"],
        description: "This is a test event",
    },
    {
        title: "Event 2",
        startDateTime: new Date(2024, 9, 27, 12),
        endDateTime: new Date(2024, 9, 27, 13),
        Tags: ["Google Drive"],
        description: "This is a test event",
    },
    {
        title: "Event 3",
        startDateTime: new Date(2024, 9, 27, 15),
        endDateTime: new Date(2024, 9, 27, 16),
        Tags: ["Google Drive"],
        description: "This is a test event",
    },
    {
        title: "Event 4",
        startDateTime: new Date(2024, 9, 27, 18),
        endDateTime: new Date(2024, 9, 27, 19),
        Tags: ["Google Drive"],
        description: "This is a test event",
    },
    {
        title: "Event 5",
        startDateTime: new Date(2024, 9, 27, 21),
        endDateTime: new Date(2024, 9, 27, 22),
        Tags: ["Google Drive"],
        description: "This is a test event",
    },
    {
        title: "Event 6",
        startDateTime: new Date(2024, 9, 27, 23),
        endDateTime: new Date(2024, 9, 28, 0),
        Tags: ["Google Drive"],
        description: "This is a test event",
    },
    {
        title: "Event 7",
        startDateTime: new Date(2024, 9, 28, 1),
        endDateTime: new Date(2024, 9, 28, 2),
        Tags: ["Google Drive"],
        description: "This is a test event",
    },
    {
        title: "Event 8",
        startDateTime: new Date(2024, 9, 28, 4),
        endDateTime: new Date(2024, 9, 28, 5),
        Tags: ["Google Drive"],
        description: "This is a test event",
    }
];

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const DayComponent: React.FC<DayProps> = ({date, setDate}) => {
    const [events, setEvents] = useState<Event[]>(exampleEvents);
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [eventStartTime, setEventStartTime] = useState(new Date());
    const [eventCreationAnchor, setEventCreationAnchor] = useState<null | HTMLElement>(null);
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

    // TODO: Implement event fetching from backend
    useEffect(() => {
        fetch(`${server_base_url}/calendar/get_events?` +
            `start_datetime=${date.toISOString()}` +
            `&end_datetime=${date.toISOString()}`)
            .then(response => response.json())
            .then(data => {
                setEvents(data.events);
            });
    }, []);
    
    const addToEvents = (title: string, startDateTime: Date, 
        endDateTime: Date, description: string) => {
        setEvents([...events, {
            title: title,
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            Tags: ["Google Drive"],
            description: description,
        }]);
    }

    const handleTimeBlockClick = (time: number, event: React.MouseEvent<HTMLButtonElement>) => {
        setDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), time));
        setIsCreatingEvent(true);
        setEventStartTime(new Date(date.getFullYear(), date.getMonth(), date.getDate(), time));
        setEventCreationAnchor(event.currentTarget);
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
                    <Button
                    key={index}
                    sx={{
                        marginTop: `${event.startDateTime.getHours() * 70 + 35}px`,
                        marginLeft: `${widthOffset - 5}px`,
                        width: '88%',
                        height: `${(event.endDateTime.getHours() - event.startDateTime.getHours()) * 70}px`,
                        backgroundColor: 'primary.main',
                        zIndex: 1,
                        position: 'absolute',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '10px',
                    }}>
                        <Typography sx={{ color: 'primary.contrastText', zIndex: 3}}>
                            {event.title}
                        </Typography>
                    </Button>
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
                        onClick={(event) => {handleTimeBlockClick(i, event)}}
                        sx={{
                            width: '100%',
                            height: '70px',
                        }}/>
                        <Menu
                            anchorEl={eventCreationAnchor}
                            open={isCreatingEvent}
                            onClose={() => setIsCreatingEvent(false)}
                            MenuListProps={{ sx: { py: 0 } }}
                            >
                            <Box sx={{ width: '500px', height: '300px', 
                                backgroundColor: 'primary.light',
                                color: 'primary.contrastText',
                                }}>
                                <CreateEvent 
                                    eventStartTime={eventStartTime} 
                                    setEventStartTime={setEventStartTime} 
                                    addToEvents={addToEvents}
                                    closeCreateEvent={() => setIsCreatingEvent(false)}
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