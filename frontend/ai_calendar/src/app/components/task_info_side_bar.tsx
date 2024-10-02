import React, { useEffect, useState } from 'react';
import { Task } from '../tasks/page';
import { Box, Drawer, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface TaskInfoSideBarProps {
    task: Task;
    openSideBar: boolean;
    setOpenSideBar: (value: boolean) => void;
}

const TaskInfoSideBar: React.FC<TaskInfoSideBarProps> = 
({ task, openSideBar: openSideBar, setOpenSideBar }) => {

    useEffect(() => {
        // TODO: fetch subtasks from backend
    }, []);



    return (
        <Drawer open={openSideBar} onClose={() => setOpenSideBar(false)} anchor='right'
        variant='persistent' sx={{ marginTop: '64px', zIndex: 1 }}>
            <Box sx={{ 
                marginTop: '64px', 
                width: '300px', height: '100%', backgroundColor: 'primary.light',
                color: 'primary.contrastText'
            }}>
                <IconButton onClick={() => setOpenSideBar(false)} 
                sx={{ color: 'primary.contrastText' }}>
                    <CloseIcon />
                </IconButton>
                <Box sx={{ paddingLeft: 2 }}>
                    <h1>{task.title}</h1>
                    <p>{task.description}</p>
                    <p>{task.startDate?.toISOString()}</p>
                    <p>{task.endDate?.toISOString()}</p>
                </Box>
            </Box>
        </Drawer>
    )
};

export default TaskInfoSideBar;