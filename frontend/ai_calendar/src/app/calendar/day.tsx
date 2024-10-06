"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Box, Button, Stack, Divider, Typography, Menu, Toolbar } from '@mui/material';
import EditEvent from "./edit_event";
import * as calendarApi from '../utils/calendar_api_funcs';

interface DayProps {
    date: Date;
    sizeChange: boolean;
}

const hourLineCount = 25;

const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface Event {
    id: number;
    title: string;
    tags: string[];
    startDateTime: Date;
    endDateTime: Date;
    description: string;
}

const topPadding = 10;

const DayComponent: React.FC<DayProps> = ({date, sizeChange}) => {
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
    }, [sizeChange]);

    useEffect(() => {
        calendarApi.fetchEvents(new Date(date.getFullYear(), date.getMonth(),
            date.getDate(), 0, 0, 0), new Date(date.getFullYear(), date.getMonth(),
            date.getDate(), 23, 59, 59), setEvents);
    }, [date]);
    
    const updateEvents = (title: string, startDateTime: Date, 
        endDateTime: Date, description: string, id: number) => {
        if (id === -1) {
            // let id: number;
            console.log("posting event: ", title, startDateTime, endDateTime, description);
            calendarApi.addEvent(title, startDateTime, endDateTime, description, 
                [], setEvents);

        }
        else {
            calendarApi.updateEvent(title, startDateTime, endDateTime, description, 
                [], id, setEvents);
        }
    }

    const deleteEvent = (id: number) => {
        calendarApi.deleteEvent(id, setEvents);
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
            height: 'calc(100vh - 130px)',
            overflowY: 'auto',
            width: '100%',
            position: 'relative',
        }}>
            <Toolbar variant="dense"
            sx={{ zIndex: 4, backgroundColor: 'primary.dark', minHeight: '30px',
                position: 'sticky', width: '100%', top: '0px'
            }}>
                <Typography fontWeight={"bold"}
                sx={{
                    position: 'absolute',
                    top: '-5px',
                    color: 'primary.contrastText',
                    fontSize: '20px',
                    zIndex: 2,
                }}>
                    {weekDays[date.getDay()]}
                </Typography>
            <Divider sx={{
                backgroundColor: 'primary.contrastText', width: '100%', 
                height: '2px', position: 'absolute', bottom: '0px'}} />
            </Toolbar>

            {/* TODO: Implement smarter event placement */}
            {events.map((event, index) => (
                <div key={index}>
                <Button
                key={index}
                onClick={(click_event) => { 
                    handleTimeBlockClick(event, click_event)}}
                sx={{
                    marginTop: `${event.startDateTime.getHours() * 70 + 
                        event.startDateTime.getMinutes() / 60 * 70 + 1 + topPadding}px`,
                    marginLeft: `${widthOffset}px`,
                    width: '88%',
                    height: `${(event.endDateTime.getTime() - 
                        event.startDateTime.getTime()) / 3600000 * 70 - 2}px`,
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

            <Box sx={{marginTop: `${topPadding-35}px`,}}>
			{Array.from({length: hourLineCount}, (_, i) => (
                <Box key={i}
                sx={{ 
                    width: '100%', 
                    flexDirection: 'row', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent:'center' }}>
                    <Typography align="right"
                        sx={{ width: '50px', paddingRight: '15px'}}>
                            {i}:00
                    </Typography>
                    <Divider
                        ref={widthOffsetRef}
                        sx={{ 
                            backgroundColor: 'primary.contrastText', 
                            height: '1px',
                            width: '88%',
                            position: 'absolute',
                            zIndex: 2,
                        }} />
                    <Box 
                    sx={{
                        flexDirection: 'column',
                        marginRight: '40px',
                        width: '88%',
                        height: '70px',
                    }}>

                        {i !== hourLineCount - 1 ? (
                            <Button variant='text'
                            onClick={(mouseEvent) => {handleTimeBlockClick(
                                constructNewEvent(new Date(date.getFullYear(), 
                                    date.getMonth(), date.getDate(), i)),
                                mouseEvent)}}
                            sx={{
                                width: '100%',
                                height: '70px',
                                top: '35px',
                                left: '-5px',
                            }}/>
                        ): null}

                    </Box>
                </Box>
            ))}
            </Box>

            <Menu
                anchorEl={eventEditAnchor}
                open={isEditingEvent}
                onClose={() => setIsEditingEvent(false)}
                MenuListProps={{ sx: { py: 0} }}
                >
                <Box sx={{ width: '500px', height: '300px', 
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    }}>
                    <EditEvent 
                        eventInfo={selectedEvent}
                        updateEvent={updateEvents}
                        deleteEvent={deleteEvent}
                        closeCreateEvent={useCallback(() => 
                            setIsEditingEvent(false), [])}
                    />
                </Box>
            </Menu>
        </Stack>
	);
};

export default DayComponent;