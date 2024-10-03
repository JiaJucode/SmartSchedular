import React, { useEffect, useState } from 'react';
import { Task } from './page';
import { Box, Drawer, IconButton, Typography } from '@mui/material';
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
        variant='persistent' sx={{ marginTop: '64px', zIndex: 5 }}>
            <Box sx={{ 
                marginTop: '64px', 
                width: '300px', height: '100%', backgroundColor: 'primary.light',
                color: 'primary.contrastText',
            }}>
                <IconButton onClick={() => setOpenSideBar(false)} 
                sx={{ color: 'primary.contrastText' }}>
                    <CloseIcon />
                </IconButton>
                <Box sx={{ paddingLeft: 2 }}>
                    <Box>
                        <Typography variant='h6'>
                            Title:
                        </Typography>
                        
                    </Box>
                </Box>
            </Box>
        </Drawer>
    )
};

export default TaskInfoSideBar;