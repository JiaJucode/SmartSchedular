"use client";

import React, { useEffect } from 'react';
import { useState } from 'react';
import SideBar from '../components/side_bar';
import { Box } from '@mui/system';
import Divider from '@mui/material/Divider';
import { ButtonGroup, Stack, Toolbar, Typography, Button } from '@mui/material';
import DayComponent from '../components/day';
import WeekComponent from '../components/week';
import Calendar from 'react-calendar';
import './styles.css';

const eventTagNames = ["Google Drive"];

const CalendarPage = () => {
    const [hideSideBar, setHideSideBar] = useState(false);
    const [delayedHide, setDelayedHide] = useState(false);
    const [eventTags, setEventTags] = useState<boolean[]>(eventTagNames.map(() => false));
    const [possibleEventTags, setPossibleEventTags] = useState<boolean[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<"day" | "week">("day");

    useEffect(() => {
        // TODO: fetch possible event tags from backend
        setPossibleEventTags([true]);
    }, []);

    const handleFilterEventTag = (index: number) => {
        let newEventTags = [...eventTags];
        newEventTags[index] = !newEventTags[index];
        setEventTags(newEventTags);
        // set date to March 1st, 2022
        setSelectedDate(new Date(2022, 2, 1));
        if (!eventTags[index]) {
            // TODO: check if account is linked to google drive
            if (false) {
                // show error message account not linked

            }
            else {
                // TODO: fetch todos for files from google drive

                setEventTags(newEventTags);
            }
        }
    }

    const handleDateChange = (
        value: Values, 
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setSelectedDate(value as Date);
    }

    return (
        <Box sx={{ width: '100vw', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', overflow: "visible"}}>
            <SideBar hide={hideSideBar} setHide={setHideSideBar} currentHide={delayedHide} setCurrentHide={setDelayedHide}>
                <Stack>
                    <Calendar locale='en-GB' onChange={handleDateChange} value={selectedDate} selectRange={false} />

                    <Divider sx={{ 
                        backgroundColor: 'primary.contrastText', width: '94%', marginLeft: '3%',
                        marginTop: '20px', marginBottom: '10px'}} />
                    <Box sx={{ paddingTop: 2 }}>
                        <Typography variant="h6" paddingLeft={1} paddingBottom={'10px'}>
                        Event Tags Filters:
                        </Typography>
                        <Stack>
                            {eventTagNames.map((name, index) => {
                                return (
                                    <Button key={index} variant='outlined' 
                                    disabled={!possibleEventTags[index]}
                                    onClick={() => handleFilterEventTag(index)}
                                    sx={{ width: '80%', 
                                        color: 'primary.contrastText',
                                        margin: 'auto',
                                        border: '1px solid',
                                        backgroundColor: eventTags[index] ? 'primary.main' : 'primary.light',}}
                                    >{name}</Button>
                                );
                            })}
                        </Stack>
                    </Box>
                </Stack>
            </SideBar>
            <Box sx={{ 
                width: delayedHide ? '100vw' : 'calc(100vw - 330px)',
                position: 'relative',
                overflowY: 'auto',
                height: '93vh',
                }}>
                <Toolbar sx={{ flexDirection: 'row', justifyContent: 'space-between', 
                    color: 'primary.contrastText', position: 'sticky', zIndex: 10, 
                    top: 0, backgroundColor: 'primary.dark' }}>
                    <Typography variant="h5" paddingLeft={2.6}>
                        {selectedDate.toDateString()}
                    </Typography>
                    <ButtonGroup variant="text" color="primary">
                        <Typography paddingTop={'5px'} paddingRight={'10px'}>
                            View Mode:
                        </Typography>
                        <Button variant='outlined' 
                        onClick={() => setViewMode("day")}
                        sx={{ width: '70px', 
                            color: 'primary.contrastText',
                            backgroundColor: viewMode === "day" ? 'primary.light' : 'primary.dark',}}
                        >Day</Button>
                        <Button variant='outlined' 
                        onClick={() => setViewMode("week")}
                        sx={{ width: '70px', 
                            color: 'primary.contrastText',
                            backgroundColor: viewMode === "week" ? 'primary.light' : 'primary.dark',}}
                        >Week</Button>
                    </ButtonGroup>
                </Toolbar>
                {viewMode === "day" ? <DayComponent date={selectedDate} setDate={setSelectedDate} /> 
                : <WeekComponent date={selectedDate} setDate={setSelectedDate} />}

            </Box>
        </Box>
    );
};

export default CalendarPage;