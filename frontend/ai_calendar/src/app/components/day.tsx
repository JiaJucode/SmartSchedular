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

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const DayComponent: React.FC<DayProps> = ({date, setDate}) => {
    const [events, setEvents] = useState<Event[]>([]);
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
        });
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
                        marginTop: `${event.startDateTime.getHours() * 70 + 
                            event.startDateTime.getMinutes() * 1.2 + 35}px`,
                        marginLeft: `${widthOffset - 5}px`,
                        width: '88%',
                        height: `${(event.endDateTime.getTime() - event.startDateTime.getTime()) / 60000 * 1.2}px`,
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