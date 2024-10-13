'use client';

import React, { useEffect } from 'react';
import { useState } from 'react';
import SideBar from '../components/side_bar';
import { Box } from '@mui/system';
import Divider from '@mui/material/Divider';
import { ButtonGroup, Stack, Toolbar, Typography, Button } from '@mui/material';
import DayComponent from './day';
import WeekComponent from './week';
import Calendar from 'react-calendar';
import './styles.css';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';

// TODO: add line for current time and auto scroll to current time
const CalendarPage = () => {
    const [openSideBar, setOpenSideBar] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
    const [eventSources, setEventSources] = useState<{[key: string]: boolean}>({});

    useEffect(() => {
    }, []);

    const handleFilterEventTag = (index: number) => {
    }

    const handleDateChange = (
        value: Values, 
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setSelectedDate(value as Date);
    }

    return (
        <Box sx={{ width: '100vw', display: 'flex', flexDirection: 'row', 
        justifyContent: 'space-between', overflow: 'visible'}}>
            <SideBar open={openSideBar} setOpen={setOpenSideBar}>
                <Stack>
                    <Calendar locale='en-GB' onChange={handleDateChange} value={selectedDate} 
                    selectRange={false} />

                    <Divider sx={{ 
                        backgroundColor: 'primary.contrastText', width: '94%', marginLeft: '3%',
                        marginTop: '20px', marginBottom: '10px'}} />
                    <Box sx={{ paddingTop: 2 }}>
                        <Typography variant='h6' paddingLeft={1} paddingBottom={'10px'}>
                        Event Sources Filters:
                        </Typography>
                        <Stack>
                            {Object.keys(eventSources).map((key, index) => {
                                return (
                                    <Button key={index} variant='outlined' 
                                    disabled={!eventSources[key]}
                                    onClick={() => handleFilterEventTag(index)}
                                    sx={{ width: '80%', 
                                        color: 'primary.contrastText',
                                        margin: 'auto',
                                        border: '1px solid',
                                        backgroundColor: eventSources[key] ? 'primary.main' 
                                        : 'primary.light',}}
                                    >{key}</Button>
                                );})}
                        </Stack>
                    </Box>
                </Stack>
            </SideBar>
            <Box sx={{ 
                width: '100vw',
                position: 'relative',
                paddingLeft: openSideBar ? '302px' : '0',
                overflowY: 'hidden',
                height: '93vh',
                }}>
                <Toolbar sx={{ flexDirection: 'row', justifyContent: 'space-between', 
                    color: 'primary.contrastText', zIndex: 5, 
                    top: 0, backgroundColor: 'primary.dark' }}>
                    { !openSideBar ? (
                            <Button onClick={() => setOpenSideBar(!openSideBar)}
                            sx={{ 
                                position: 'absolute',
                                color: 'primary.contrastText', 
                                backgroundColor: 'primary.light',
                                borderRadius: '20px',
                                height: '40px',
                                left: '-25px',
                                top: '0px',
                                '&:hover': {
                                    backgroundColor: 'primary.light',
                                },
                                '&.MuiButtonBase-root': {
                                    paddingRight: '0px',
                                    paddingLeft: '0px',
                                }
                            }}>
                                <KeyboardDoubleArrowRightIcon sx={{ 
                                paddingLeft: '0px', right: '5px', fontSize: '1.5em',
                                position: 'absolute'}} />
                            </Button>
                        )
                        : null}
                    <Typography variant='h5' paddingLeft={2.6} width={'220px'}>
                        {selectedDate.toDateString()}
                    </Typography>
                    <ButtonGroup variant='text' color='primary'
                    sx={{ backgroundColor: 'primary.light', borderRadius: '10px' }}>
                        <Button onClick={() => 
                            {
                                if (viewMode === 'day') {
                                    setSelectedDate(new Date(selectedDate.setDate(
                                        selectedDate.getDate() - 1)))
                                }
                                else {
                                    setSelectedDate(new Date(selectedDate.setDate(
                                        selectedDate.getDate() - 7)))
                                }
                            }}>
                            <ArrowLeftIcon sx={{ color: 'primary.contrastText', fontSize: '2rem' }} />
                        </Button>
                        <Button onClick={() => setSelectedDate(new Date())}>
                            <Typography variant='h6' fontWeight='bold' color='primary.contrastText'>
                                Today
                            </Typography>
                        </Button>
                        <Button onClick={() => 
                            {
                                if (viewMode === 'day') {
                                    setSelectedDate(new Date(selectedDate.setDate(
                                        selectedDate.getDate() + 1)))
                                }
                                else {
                                    setSelectedDate(new Date(selectedDate.setDate(
                                        selectedDate.getDate() + 7)))
                                }
                            }}>
                            <ArrowRightIcon sx={{ color: 'primary.contrastText', fontSize: '2rem' }} />
                        </Button>
                    </ButtonGroup>
                    <ButtonGroup variant='text' color='primary'>
                        <Typography paddingTop={'5px'} paddingRight={'10px'}>
                            View Mode:
                        </Typography>
                        <Button variant='outlined' 
                        onClick={() => setViewMode('day')}
                        sx={{ width: '70px', 
                            color: 'primary.contrastText',
                            backgroundColor: viewMode === 'day' ? 'primary.light' : 'primary.dark',}}
                        >Day</Button>
                        <Button variant='outlined' 
                        onClick={() => setViewMode('week')}
                        sx={{ width: '70px', 
                            color: 'primary.contrastText',
                            backgroundColor: viewMode === 'week' ? 'primary.light' : 'primary.dark',}}
                        >Week</Button>
                    </ButtonGroup>
                </Toolbar>
                {viewMode === 'day' ? <DayComponent date={selectedDate} sizeChange={openSideBar}/> 
                : <WeekComponent date={selectedDate} sizeChange={openSideBar}/>}
            </Box>
        </Box>
    );
};

export default CalendarPage;