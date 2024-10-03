import React, { useEffect, useState } from 'react';
import { Task } from './page';
import { Box, Drawer, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LiveSyncTextfield from './live_sync_textfield';

interface TaskInfoSideBarProps {
    task: Task;
    refreshTask: (task_id: number) => void;
    openSideBar: boolean;
    setOpenSideBar: (value: boolean) => void;
}

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const TaskInfoSideBar: React.FC<TaskInfoSideBarProps> = 
({ task, refreshTask, openSideBar: openSideBar, setOpenSideBar }) => {
    const [subtasks, setSubtasks] = useState<Task[]>([]);

    useEffect(() => {
        fetch(`${server_base_url}/task/get_tasks?parent_id=${task.id}`)
        .then((response) => response.json())
        .then((data: {tasks: {id: number, title: string, description: string,
            start_datetime: string, end_datetime: string, priority: number,
            estimated_time: number, completed: boolean}[]
        }) => {
            setSubtasks(data.tasks.map((task) => ({
                id: task.id,
                title: task.title,
                description: task.description,
                startDate: task.start_datetime === "" || !task.start_datetime 
                    ? null : new Date(task.start_datetime),
                endDate: task.end_datetime === "" || !task.end_datetime
                    ? null : new Date(task.end_datetime),
                priority: task.priority,
                estimatedTime: task.estimated_time,
                completed: task.completed,
            })));
        });
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