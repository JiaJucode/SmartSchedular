import React, { use, useEffect, useState } from 'react';
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
    setCurrentTask: (task: Task) => void;
    openSideBar: boolean;
    setOpenSideBar: (value: boolean) => void;
    setRefresh: () => void;
}

const TaskInfoSideBar: React.FC<TaskInfoSideBarProps> = 
({ currentTask, setCurrentTask, openSideBar, setOpenSideBar, setRefresh }) => {
    const [task, setTask] = useState<Task>(currentTask);
    const [subtasks, setSubtasks] = useState<Task[]>([]);
    const [description, setDescription] = useState<string>('');

    useEffect(() => {
        setTask(currentTask);
    }, [currentTask]);

    useEffect(() => {
        setDescription(task.description);
        taskApi.fetchTasks(task.id, setSubtasks);
    }, [currentTask]);

    const updateTask = (task: Task) => {
        setCurrentTask(task);
        setTask(task);
    }

    const addTask = () => {
        taskApi.addTask(task.id, setSubtasks);
    }

    const deleteTask = (task_id: number) => {
        taskApi.deleteTask(task_id, setSubtasks);
        setRefresh();
        setOpenSideBar(false);
    }

    const scheduleTask = async () => {
        const timeLeft = await taskApi.scheduleTask(task.id);
        updateTask({...task, hoursToSchedule: timeLeft});
    }

    const deScheduleTask = () => {
        taskApi.descheduleTask(task.id);
        updateTask({...task, hoursToSchedule: task.estimatedTime});
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
                    paddingTop: '2px',
                    justifyContent: 'space-between' }}>
                    <IconButton onClick={() => setOpenSideBar(false)} 
                    sx={{ color: 'inherit' }}>
                        <CloseIcon />
                    </IconButton>
                    <Box sx={{ flexDirection: 'row', display: 'flex', alignItems: 'center', 
                        width: '30%' }}>
                        <LiveSyncCheckbox task_id={task.id} fieldKey='completed'
                        checked={task.completed} setChecked={(checked) => {
                            updateTask({...task, completed: checked});
                        }} />
                        <Button onClick={() => deleteTask(task.id)}
                        sx={{ color: 'inherit' }}>
                            <DeleteIcon />
                        </Button>
                    </Box>
                            
                </Box>
                <Stack spacing={1} sx={{ paddingLeft: 2, paddingRight: 2 }}>
                    <Box sx={{ width: '100%', height: '50px',
                        justifyContent: 'center', display: 'flex',
                        '& .MuiInputBase-input': {
                            fontSize: '1.5rem',
                        },
                    }}>
                        <LiveSyncTextfield task_id={task.id} fieldKey='title'
                        textValue={task.title} setTextValue={(title) => {
                            updateTask({...task, title: title});
                        }} numberOnly={false} />
                    </Box>
                    <Box sx={{ flexDirection: 'row', display: 'flex', alignItems: 'center', 
                        justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '1.1rem' }}>
                            start Date:
                        </Typography>
                        <Box sx={{ width: '50%', position: 'relative' }}>
                        <LiveSyncDatePicker task_id={task.id} fieldKey='start_datetime'
                        dateValue={task.startDate} setDateValue={(date) => {
                            updateTask({...task, startDate: date});
                        }} />
                        </Box>
                    </Box>
                    <Box sx={{ flexDirection: 'row', display: 'flex', alignItems: 'center', 
                        justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '1.1rem' }}>
                            End Date:
                        </Typography>
                        <Box sx={{ width: '50%', position: 'relative' }}>
                        <LiveSyncDatePicker task_id={task.id} fieldKey='end_datetime'
                        dateValue={task.endDate} setDateValue={(date) => {
                            updateTask({...task, endDate: date});
                        }} />
                        </Box>
                    </Box>
                    <Box sx={{ flexDirection: 'row', display: 'flex', alignItems: 'center', 
                        justifyContent: 'space-between', height: '30px' }}>
                        <Typography sx={{ fontSize: '1.1rem' }}>
                            Priority:
                        </Typography>
                        <Box sx={{ width: '50%' }}>
                        <LiveSyncTextfield task_id={task.id} fieldKey='priority'
                        textValue={task.priority.toString()} setTextValue={(priority) => {
                            updateTask({...task, priority: parseInt(priority)});
                        }} numberOnly={true} />
                        </Box>
                    </Box>
                    <Box sx={{ flexDirection: 'row', display: 'flex', alignItems: 'center', 
                        justifyContent: 'space-between', height: '30px' }}>
                        <Typography sx={{ fontSize: '1.1rem' }}>
                            Estimated Time:
                        </Typography>
                        <Box sx={{ width: '50%' }}>
                        <LiveSyncTextfield task_id={task.id} fieldKey='estimated_time'
                        setTextValue={(time) => {
                            updateTask({...task, estimatedTime: parseInt(time)});
                        }} textValue={task.estimatedTime ? task.estimatedTime.toString() : ''}
                        numberOnly={true} />
                        </Box>
                    </Box>
                    <Box sx={{ flexDirection: 'row', display: 'flex', alignItems: 'center', 
                        justifyContent: 'space-between', height: '30px' }}>
                        <Typography sx={{ fontSize: '1.1rem' }}>
                            Hours To Schedule:
                        </Typography>
                        <Typography sx={{ width: '50%', justifyContent: 'center', display: 'flex' }}>
                            {task.hoursToSchedule}
                        </Typography>
                    </Box>
                    <Box sx={{ flexDirection: 'row', display: 'flex', alignItems: 'center', 
                        justifyContent: 'space-between' }}>
                        <Button onClick={() => scheduleTask()} variant='contained'
                        sx={{ color: 'inherit', alignContent: 'center', display: 'flex', 
                            textTransform: 'none' }}>
                                Schedule
                        </Button>
                        <Button onClick={() => deScheduleTask()} variant='contained'
                        sx={{ color: 'inherit', alignContent: 'center', display: 'flex',
                            textTransform: 'none' }}>
                                De-Schedule
                        </Button>
                    </Box>
                    <Typography sx={{ fontSize: '1.1rem' }}>
                        Description:
                    </Typography>
                    <Box sx={{ border: '1px solid', width: '100%', height: '200px'}}>
                        <TextField value={description} fullWidth multiline
                        variant='standard' slotProps={{ 
                            input: {disableUnderline: true} }}
                        onChange={(e) => {
                            setDescription(e.target.value);
                        }
                        } onBlur={() => {
                            taskApi.updateTask(task.id, 'description', description);
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
                                checked={subtask.completed} setChecked={(checked) => {
                                    taskApi.updateTask(subtask.id, 'completed', checked);
                                }} />
                                <Button 
                                onClick={() => updateTask(subtask)}
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