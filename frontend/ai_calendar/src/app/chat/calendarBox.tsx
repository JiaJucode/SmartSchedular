import React, { useState, useEffect } from "react";
import { Event } from "../calendar/day";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { Box, Button, TextField, Typography } from "@mui/material";
import * as calendarApi from "../utils/calendar_api_funcs";
import { DocumentSegments } from '../chat/page';

type CalendarBoxProps = {
    suggestedEvents: Event[];
    reference_docs: DocumentSegments;
}

const CalendarBox: React.FC<CalendarBoxProps> = ({suggestedEvents, reference_docs}) => {
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        setEvents(suggestedEvents);
    }, [suggestedEvents]);

    function handleDelete(index: number): void {
        setEvents(events.filter((_, i) => i !== index));
    }

    function handleAdd(index: number): void {
        const newEvent = events[index];
        calendarApi.addEvent(newEvent.title, newEvent.startDateTime, newEvent.endDateTime, 
            newEvent.description, newEvent.tags, (() => {}), reference_docs);
        // TODO: maybe handle this differently
        setEvents(events.filter((_, i) => i !== index));
    }

    return (
        <Box>
            {events.map((event, index) => (
                <Box key={index}
                sx={{
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    display: 'flex',
                    width: '100%',
                    borderRadius: '10px',
                }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        height: '30px',
                        width: '100%',
                    }}>
                        <Button sx={{ width: '60px', height: '40px', 
                            margin: '5px', backgroundColor: 'primary.dark', 
                            color: 'primary.contrastText' }}
                            onClick = {() => handleDelete(index)}>
                            CANCEL
                        </Button>
                        <Button sx={{ width: '70px', height: '40px', 
                            margin: '5px', backgroundColor: 'primary.dark', 
                            color: 'primary.contrastText' }}
                            onClick = {() => handleAdd(index)}>
                            EXECUTE
                        </Button>
                    </Box>
                    <TextField
                        fullWidth variant='standard'
                        value={event.title}
                        slotProps={{ 
                            input: {disableUnderline: true} }}
                        sx={{
                            width: '70%', 
                            margin: 'auto',
                            display: 'flex',
                            transform: 'translateY(-15px)',
                            input: {
                                color: 'primary.contrastText',
                                textAlign: 'center',
                                fontSize: '25px',
                            },
                        }}
                    />
                    {event.startDateTime !== null ? (
                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
                                width: '100%', paddingLeft: '5px', paddingRight: '5px', }}>
                            <Typography sx={{ fontSize: '15px', color: 'primary.contrastText', display: 'flex', alignItems: 'center' }}>
                                Start datetime:
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateTimePicker
                                disableOpenPicker
                                value={dayjs(event.startDateTime)}
                                onChange={(date) => {
                                    // send update task request to backend
                                }}
                                sx={{
                                    width: '70%',
                                    height: '100%',
                                    input: {
                                        border: 'none',
                                        height: '40px',
                                        color: 'primary.contrastText',
                                        padding: 0,
                                        textAlign: 'center',
                                    },
                                }}
                            />
                            </LocalizationProvider>
                        </Box>
                    ): null}
                    {event.endDateTime !== null ? (
                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
                                width: '100%', paddingLeft: '5px', paddingRight: '5px', }}>
                            <Typography sx={{ fontSize: '15px', color: 'primary.contrastText', display: 'flex', alignItems: 'center' }}>
                                End datetime:
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateTimePicker
                                disableOpenPicker
                                value={dayjs(event.endDateTime)}
                                onChange={(date) => {
                                    // send update task request to backend
                                }}
                                sx={{
                                    width: '70%',
                                    height: '100%',
                                    input: {
                                        border: 'none',
                                        height: '40px',
                                        color: 'primary.contrastText',
                                        padding: 0,
                                        textAlign: 'center',
                                    },
                                }}
                            />
                            </LocalizationProvider>
                        </Box>
                    ): null}
                    <Typography sx={{ fontSize: '15px', color: 'primary.contrastText', display: 'flex', 
                        alignItems: 'center', paddingLeft: '5px', paddingRight: '5px'}}>
                        Description:
                    </Typography>
                    <TextField 
                        fullWidth variant='outlined'
                        value={event.description}
                        sx={{
                            width: '98%', 
                            margin: 'auto',
                            display: 'flex',
                            paddingBottom: '10px',
                            input: {
                                color: 'primary.contrastText',
                                fontSize: '15px',
                            },
                        }}
                    />

                </Box>
            ))}
        </Box>
    );
}

export default CalendarBox;