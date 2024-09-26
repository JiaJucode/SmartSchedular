"use client";

import React from 'react';
import { useState } from 'react';
import SideBar from '../components/side_bar';
import { Box } from '@mui/system';

const CalendarPage = () => {
    const [hideSideBar, setHideSideBar] = useState(false);
    const [delayedHide, setDelayedHide] = useState(false);

    return (
        <Box sx={{ width: '100vw', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', overflow: "visible"}}>
            <SideBar hide={hideSideBar} setHide={setHideSideBar} currentHide={delayedHide} setCurrentHide={setDelayedHide}>
                <Box></Box>
            </SideBar>
            <Box sx={{ 
                width: delayedHide ? '100vw' : 'calc(100vw - 330px)',
                transition: 'width 0.5s ease',
                position: 'relative',
                }}>
            </Box>
        </Box>
    );
};

export default CalendarPage;