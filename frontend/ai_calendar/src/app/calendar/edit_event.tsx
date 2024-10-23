"use client";

import React from "react";
import { useState } from "react";
import { Stack, Box, TextField, Typography, Button } from "@mui/material";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

interface Event {
    id: number;
    title: string;
    startDateTime: Date;
    tags: string[];
    endDateTime: Date;
    description: string;
}

interface CreateEventProps {
    eventInfo: Event;
    updateEvent: (title: string, startDateTime: Date, 
        endDateTime: Date, description: string, id: number) => void;
    deleteEvent: (id: number) => void;
    closeCreateEvent: () => void;
}

const EditEvent = ({eventInfo, updateEvent, deleteEvent, closeCreateEvent}: CreateEventProps) => {
    const [eventTitle, setEventTitle] = useState<string>(eventInfo.title);
    const [eventDescription, setEventDescription] = useState<string>(eventInfo.description);
    const [startTime, setStartTime] = useState<Date>(eventInfo.startDateTime);
    const [endTime, setEndTime] = useState<Date>(eventInfo.endDateTime);
    // new Date(eventStartTime.getTime() + 60 * 60 * 1000)
    const [eventTags, setEventTags] = useState<string[]>(eventInfo.tags);

    const handleCreateEvent = () => {
        updateEvent(eventTitle, startTime, endTime, eventDescription, eventInfo.id);
        closeCreateEvent();
    }

    return (
        <Stack padding={0.5} spacing={2}>
            <TextField id="event-title" label="Event Title" 
            variant="standard" value={eventTitle} 
            onChange={(e) => setEventTitle(e.target.value)} 
            sx={{
                width: '50%',
                input: {
                    color: 'primary.contrastText', // Text color inside the input
                },
                label: {
                    color: 'primary.contrastText', // Label color
                },
            }}/>
            <Box width={'100%'}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker label="Start Date and Time" value={dayjs(startTime)}
                onChange={(newValue) => newValue ? setStartTime(newValue.toDate()) : null}
                disableOpenPicker format="DD/MM/YYYY HH:mm"
                sx={{
                    marginTop: '10px',
                    paddingRight: '4%',
                    input: {
                        color: 'primary.contrastText', // Text color inside the input
                    },
                    label: {
                        color: 'primary.contrastText', // Label color
                    },
                    // change on select
                    '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                            borderColor: 'primary.main', // Border color when hovered
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: 'primary.main', // Border color when focused
                        },
                    },
                }}
                />
                <DateTimePicker label="End Date and Time" value={dayjs(endTime)}
                onChange={(newValue) => newValue ? setEndTime(newValue.toDate()) : null}
                disableOpenPicker format="DD/MM/YYYY HH:mm"
                sx={{
                    marginTop: '10px',
                    input: {
                        color: 'primary.contrastText',
                    },
                    label: {
                        color: 'primary.contrastText',
                    },
                    '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                            borderColor: 'primary.main',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                        },
                    },
                }}
                />
            </LocalizationProvider>
            </Box>
            <Box sx={{height: "20px"}}>
                <Typography sx={{ paddingBottom: '10px', font: 20}}>
                    Event Tags:
                </Typography>
                {eventTags.map((tag, index) => {
                    return (
                        <Box key={index} sx={{ display: 'inline-block', paddingRight: '10px'}}>
                            <Typography sx={{ display: 'inline-block', paddingRight: '10px', color: 'primary.contrastText'}}>
                                {tag}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
            <TextField id="description" label="Event Description" variant="standard"
            value={eventDescription} onChange={(e) => setEventDescription(e.target.value)}
            sx={{
                width: '100%',
                input: {
                    color: 'primary.contrastText', // Text color inside the input
                },
                label: {
                    color: 'primary.contrastText', // Label color
                },
            }}/>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                {eventInfo.id !== -1 ?
                    <Button 
                    onClick={() => {
                        deleteEvent(eventInfo.id)
                        closeCreateEvent()
                    }}
                    variant="contained" color="primary"
                    sx={{ width: '30%', marginRight: '10px'}}>
                        Delete
                    </Button>
                : null}
                <Button 
                onClick={() => handleCreateEvent()}
                variant="contained" color="primary"
                sx={{ width: '30%', marginRight: '10px'}}>
                    Save
                </Button>
            </Box>
        </Stack>
    );
};

export default EditEvent;