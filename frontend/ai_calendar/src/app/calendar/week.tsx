"use client";
// TODO: refactor this with day to remove duplicate code

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Box, Button, Stack, Divider, Typography, Menu, Toolbar } from '@mui/material';
import EditEvent from "./edit_event";
import { Event } from "./day";
import * as calendarApi from '../utils/calendar_api_funcs';

interface WeekProps {
    date: Date;
    sizeChange: boolean;
}

const hourLineCount = 25;

const daysInWeek = 7;

const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const topPadding = 10;

const WeekComponent: React.FC<WeekProps> = ({date, sizeChange}) => {
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

    // for event placement
    const [widthOffset, setWidthOffset] = useState(0);
    const [length, setLength] = useState(0);

    const widthOffsetRef = useRef<HTMLHRElement>(null);
    const componentRef = useRef<HTMLDivElement>(null);

    const calculateWidthOffset = () => {
        if (widthOffsetRef.current && componentRef.current) {
            const rect = widthOffsetRef.current.getBoundingClientRect();
            const componentRect = componentRef.current.getBoundingClientRect();
            setWidthOffset(rect.left - componentRect.left);
            setLength(rect.width);
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
        // calculate week start and end
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + (6 - date.getDay()));
        calendarApi.fetchEvents(start, end, setEvents);
    }, [date]);
    
    const updateEvents = (title: string, startDateTime: Date, 
        endDateTime: Date, description: string, id: number) => {
        if (id === -1) {
            calendarApi.addEvent(title, startDateTime, endDateTime, description,
                ["Google Drive"], setEvents);
        }
        else {
            calendarApi.updateEvent(title, startDateTime, endDateTime, description,
                ["Google Drive"], id, setEvents);
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
            height: '90%',
            overflowY: 'auto',
            width: '100%',
            position: 'relative',
        }}>
            <Box>
            <Toolbar variant="dense"
            sx={{ zIndex: 4, backgroundColor: 'primary.dark', minHeight: '30px'}}>
                {Array.from({length: daysInWeek}, (_, j) => (
                    <Typography key={j} align="center" fontWeight={"bold"}
                    sx={{ 
                        width: '12.57%',
                        position: 'absolute',
                        top: '-5px',
                        marginLeft: `${(j + 1) * length/daysInWeek - widthOffset - 30}px`,
                        color: 'primary.contrastText',
                        fontSize: '20px',
                        zIndex: 2,
                    }}>
                        {weekDays[j]}
                    </Typography>
                ))}
                <Divider sx={{
                    backgroundColor: 'primary.contrastText', width: '100%', 
                    height: '2px', position: 'absolute', bottom: '0px'}} />
            </Toolbar>
            </Box>
            

            {/* TODO: Implement smarter event placement */}
            {events.map((event, index) => (
                <div key={index}>
                <Button
                key={index}
                onClick={(click_event) => { 
                    handleTimeBlockClick(event, click_event)}}
                sx={{
                    marginTop: `${event.startDateTime.getHours() * 70 + 
                        event.startDateTime.getMinutes() * 1.2 + 1 + topPadding}px`,
                    marginLeft: `${widthOffset + length/daysInWeek * 
                        event.startDateTime.getDay() + 1}px`,
                    width: 'calc(12.57% - 1px)',
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

            {Array.from({length: daysInWeek - 1}, (_, j) => (
                <div key={j}>
                    <Divider
                    orientation="vertical"
                    sx={{
                        width: '1px',
                        height: `${(hourLineCount - 1) * 70}px`,
                        marginTop: `${topPadding}px`,
                        backgroundColor: 'primary.contrastText',
                        marginLeft: `${(j + 1) * length/daysInWeek + widthOffset}px`,
                        position: 'absolute',
                        zIndex: 2,
                    }}/>
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
                            <div>
                            {Array.from({length: daysInWeek}, (_, j) => (
                                <Button variant='text' key={i*daysInWeek + j}
                                onClick={(mouseEvent) => {handleTimeBlockClick(
                                    constructNewEvent(new Date(date.getFullYear(), 
                                        date.getMonth(), date.getDate() 
                                        - date.getDay() + j, i)),
                                    mouseEvent)}}
                                sx={{
                                    width: '14.28%',
                                    height: '70px',
                                    top: '35px',
                                    left: '-5px',
                                }}/>
                                ))}
                            </div>
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

export default WeekComponent;