import React, { useEffect, useState } from 'react';
import { Task } from './page';
import { Box, Button, Checkbox, Drawer, IconButton, Stack, TextField, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LiveSyncTextfield from './live_sync_textfield';
import LiveSyncDatePicker from './live_sync_date_picker';
import AddIcon from '@mui/icons-material/Add';
import LiveSyncCheckbox from './live_sync_checkbox';
import DeleteIcon from '@mui/icons-material/Delete';

interface TaskInfoSideBarProps {
    currentTask: Task;
    openSideBar: boolean;
    setOpenSideBar: (value: boolean) => void;
}

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const TaskInfoSideBar: React.FC<TaskInfoSideBarProps> = 
({ currentTask, openSideBar: openSideBar, setOpenSideBar }) => {
    const [task, setTask] = useState<Task>(currentTask);
    const [subtasks, setSubtasks] = useState<Task[]>([]);
    const [description, setDescription] = useState<string>('');

    useEffect(() => {
        setTask(currentTask);
    }, [currentTask]);

    useEffect(() => {
        setDescription(task.description);
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
    }, [task]);

    const updateDesciption = (task_id: number) => {
        fetch(`${server_base_url}/task/update_task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: task_id,
                description: description,
            }),
        })
    }

    const addTask = () => {
        fetch(`${server_base_url}/task/add_task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                parent_id: task.id,
                title: 'New Task',
                description: '',
                start_datetime: '',
                end_datetime: '',
                priority: 0,
                estimated_time: 0,
                completed: false,
            }),
        })
        .then((response) => response.json())
        .then((data: {id: number}) => {
            setSubtasks([...subtasks, {
                id: data.id,
                title: 'New Task',
                description: '',
                startDate: null,
                endDate: null,
                priority: 0,
                estimatedTime: 0,
                completed: false,
            }]);
        });
    }

    const deleteTask = (task_id: number) => {
        fetch(`${server_base_url}/task/delete_task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: task_id,
            }),
        })
        .then(() => {
            setSubtasks(subtasks.filter((task) => task.id !== task_id));
        });
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
                    sx={{ color: 'primary.contrastText' }}>
                        <CloseIcon />
                    </IconButton>
                    <Box>
                        <LiveSyncCheckbox task_id={task.id} fieldKey='completed'
                        value={task.completed} />
                        <Button onClick={() => deleteTask(task.id)}
                        sx={{ color: 'primary.contrastText' }}>
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
                            updateDesciption(task.id);
                        }}
                        sx={{
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            flexGrow: 1, textOverflow: 'ellipsis', padding: 1,
                            color: 'primary.contrastText',
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
                                sx={{ color: 'primary.contrastText', width: '100%' }}>
                                    {subtask.title}
                                </Button>
                            </Box>
                        );
                                    
                    }
                    )}
                    <Button onClick={addTask}
                    sx={{ 
                        width: '100%', justifyContent: 'flex-start',
                        backgroundColor: 'primary.dark', color: 'primary.contrastText',
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