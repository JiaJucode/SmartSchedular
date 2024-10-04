import React, { useEffect, useState } from 'react';
import { Task } from './page';
import { Box, Button, Drawer, IconButton, Stack, TextField, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LiveSyncTextfield from './live_sync_textfield';
import LiveSyncDatePicker from './live_sync_date_picker';
import AddIcon from '@mui/icons-material/Add';
import LiveSyncCheckbox from './live_sync_checkbox';
import DeleteIcon from '@mui/icons-material/Delete';
import * as taskApi from '../utils/task_api_funcs';

interface TaskInfoSideBarProps {
    currentTask: Task;
    openSideBar: boolean;
    setOpenSideBar: (value: boolean) => void;
    setRefresh: () => void;
}

const TaskInfoSideBar: React.FC<TaskInfoSideBarProps> = 
({ currentTask, openSideBar, setOpenSideBar, setRefresh }) => {
    const [task, setTask] = useState<Task>(currentTask);
    const [subtasks, setSubtasks] = useState<Task[]>([]);
    const [description, setDescription] = useState<string>('');

    useEffect(() => {
        setTask(currentTask);
    }, [currentTask]);

    useEffect(() => {
        setDescription(task.description);
        taskApi.fetchTasks(task.id, setSubtasks);
    }, [task]);

    const addTask = () => {
        taskApi.addTask(task.id, setSubtasks);
        // TODO: refresh task in page
    }

    const deleteTask = (task_id: number) => {
        taskApi.deleteTask(task_id, setSubtasks);
        setRefresh();
        setOpenSideBar(false);
    }

    return (
        <Drawer open={openSideBar} onClose={() => setOpenSideBar(false)} anchor='right'
        variant='persistent' sx={{ marginTop: '64px', zIndex: 5 }}>
            <Box sx={{ 
                marginTop: '64px', 
                width: '380px', height: '100%', backgroundColor: 'primary.light',
                color: 'primary.contrastText',
            }}>
                <Box sx={{ flexDirection: 'row', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between' }}>
                    <IconButton onClick={() => setOpenSideBar(false)} 
                    sx={{ color: 'inherit' }}>
                        <CloseIcon />
                    </IconButton>
                    <Box>
                        <LiveSyncCheckbox task_id={task.id} fieldKey='completed'
                        value={task.completed} />
                        <Button onClick={() => deleteTask(task.id)}
                        sx={{ color: 'inherit' }}>
                            <DeleteIcon />
                        </Button>
                    </Box>
                            
                </Box>
                <Stack spacing={1} sx={{ paddingLeft: 2, paddingRight: 2 }}>
                    <Box sx={{ flexDirection: 'row', display: 'flex', alignItems: 'center', 
                        justifyContent: 'space-between'}}>
                        <Typography sx={{ fontSize: '1.2rem' }}>
                            Title:
                        </Typography>
                        <Box sx={{ border: '1px solid', width: '60%' }}>
                        <LiveSyncTextfield task_id={task.id} fieldKey='title'
                        value={task.title} numberOnly={false} />
                        </Box>
                    </Box>
                    <Box sx={{ flexDirection: 'row', display: 'flex', alignItems: 'center', 
                        justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '1.2rem' }}>
                            start Date:
                        </Typography>
                        <Box sx={{ border: '1px solid', width: '60%', position: 'relative' }}>
                        <LiveSyncDatePicker task_id={task.id} fieldKey='start_datetime'
                        value={task.startDate} />
                        </Box>
                    </Box>
                    <Box sx={{ flexDirection: 'row', display: 'flex', alignItems: 'center', 
                        justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '1.2rem' }}>
                            End Date:
                        </Typography>
                        <Box sx={{ border: '1px solid', width: '60%', position: 'relative' }}>
                        <LiveSyncDatePicker task_id={task.id} fieldKey='end_datetime'
                        value={task.endDate} />
                        </Box>
                    </Box>
                    <Box sx={{ flexDirection: 'row', display: 'flex', alignItems: 'center', 
                        justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '1.2rem' }}>
                            Priority:
                        </Typography>
                        <Box sx={{ border: '1px solid', width: '60%' }}>
                        <LiveSyncTextfield task_id={task.id} fieldKey='priority'
                        value={task.priority.toString()} numberOnly={true} />
                        </Box>
                    </Box>
                    <Box sx={{ flexDirection: 'row', display: 'flex', alignItems: 'center', 
                        justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '1.2rem' }}>
                            Estimated Time:
                        </Typography>
                        <Box sx={{ border: '1px solid', width: '60%' }}>
                        <LiveSyncTextfield task_id={task.id} fieldKey='estimated_time'
                        value={task.estimatedTime ? task.estimatedTime.toString() : ''}
                        numberOnly={true} />
                        </Box>
                    </Box>
                    <Typography sx={{ fontSize: '1.2rem' }}>
                        description:
                    </Typography>
                    <Box sx={{ border: '1px solid', width: '100%', height: '200px'}}>
                        <TextField value={description} fullWidth multiline
                        variant='standard' slotProps={{ 
                            input: {disableUnderline: true} }}
                        onChange={(e) => {
                            setDescription(e.target.value);
                        }
                        } onBlur={() => {
                            taskApi.updateTask(task_id, 'description', description);
                        }}
                        sx={{
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            flexGrow: 1, textOverflow: 'ellipsis', padding: 1,
                            color: 'inherit',
                            '& .MuiInputBase-input': {
                                color: 'primary.contrastText',
                            },
                        }}/>
                    </Box>
                    {subtasks.map((subtask, index) => {
                        return (
                            <Box key={index} sx={{ border: '1px solid', width: '100%', 
                                flexDirection: 'row', display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between'}}>
                                <LiveSyncCheckbox task_id={subtask.id} fieldKey='completed'
                                value={subtask.completed} />
                                <Button 
                                onClick={() => setTask(subtask)}
                                sx={{ color: 'inherit', width: '100%' }}>
                                    {subtask.title}
                                </Button>
                            </Box>
                        );
                                    
                    }
                    )}
                    <Button onClick={addTask}
                    sx={{ 
                        width: '100%', justifyContent: 'flex-start',
                        backgroundColor: 'inherit', color: 'inherit',
                        '&.MuiButton-root': {
                            padding: 0,
                            paddingTop: '3px', paddingBottom: '3px',
                        }
                    }}>
                        <AddIcon />
                        <Typography 
                        sx={{ marginLeft: '5px', textTransform: 'none'}}>
                            Add Subtask
                        </Typography>
                    </Button>
                    
                    
                </Stack>
            </Box>
        </Drawer>
    )
};

export default TaskInfoSideBar;