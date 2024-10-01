import React, { useEffect, useState } from 'react';
import { Task } from '../tasks/page';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Collapse, Divider, Typography, IconButton, TextField } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import Checkbox from '@mui/material/Checkbox';

interface ExpandableTaskProps {
    parentId: number;
    paddingLeft: number;
}

const tasks1 = [
    {
        id: 4,
        name: 'Task 1',
        description: 'Description 1',
        startDateTime: new Date(2021, 10, 1),
        endDateTime: new Date(2021, 10, 2),
        completed: false,
    },
    {
        id: 5,
        name: 'Task 2',
        description: 'Description 2',
        startDateTime: new Date(2021, 10, 3),
        endDateTime: new Date(2021, 10, 4),
        completed: false,
    },
]

const ExpandableTask: React.FC<ExpandableTaskProps> = ({parentId, paddingLeft}) => {
    const [expandedTasks, setExpandedTasks] = useState(new Set<number>());
    const [tasks, setTasks] = useState<Task[]>((parentId <= 2) ? tasks1 : []);

    useEffect(() => {
        // use parent ID to fetch sub tasks
    }, []);

    const handleToggle = (id: number) => {
        const newExpandedTasks = new Set(expandedTasks);
        if (expandedTasks.has(id)) {
            newExpandedTasks.delete(id);
        } else {
            newExpandedTasks.add(id);
        }
        setExpandedTasks(newExpandedTasks);
    }

    const addTask = () => {
        // TODO: send request to backend to add task and get new task id
        let id = tasks.length + 1;
        setTasks((prevTasks) => {
            return [...prevTasks, {
                id: id,
                name: 'new task',
                description: '',
                startDateTime: null,
                endDateTime: null,
                completed: false,
            }];
        });
    }

    const updateTask = (task: Task) => {
        // TODO: send request to backend to update task
        setTasks((prevTasks) => {
            const newTasks = [...prevTasks];
            const index = newTasks.findIndex((t) => t.id === task.id);
            newTasks[index] = task;
            return newTasks;
        });
    }
    return (
        <div>
            {tasks.map((task) => (
                <Box key={task.id}
                sx={{ backgroundColor: `${expandedTasks.has(task.id)
                        ? 'primary.main' : 'primary.dark'}`,
                    color: 'primary.contrastText'}}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', height: '40px' }}>
                        <Box sx={{ width: '60%',
                            display: 'flex', flexDirection: 'row', paddingLeft: `${paddingLeft}px`,
                            '&.MuiButton-root': {
                                margin: 0,
                            }
                        }}>
                            <IconButton onClick={() => handleToggle(task.id)}
                            sx={{ justifyContent: 'flex-start', padding: 0,
                                color: 'primary.contrastText'
                            }}>
                                {expandedTasks.has(task.id) 
                                ? <ArrowDropDownIcon /> 
                                : <ArrowRightIcon />}
                            </IconButton>
                            <TextField value={task.name} fullWidth variant='standard'
                            slotProps={{ 
                                input: {disableUnderline: true} }}
                            onChange={(e) => {
                                    task.name = e.target.value;
                                    updateTask(task);}} 
                            sx={{
                                marginLeft: 1, display: 'flex',
                                justifyContent: 'center', alignItems: 'center',
                                flexGrow: 1, textOverflow: 'ellipsis',
                                input: {
                                    color: 'primary.contrastText',
                                },
                                '&.MuiTextField-root' : {
                                    margin: 0,
                                },
                            }}/>
                            <Divider orientation='vertical' 
                            sx={{ backgroundColor: 'primary.contrastText', 
                                width: '1px',
                            }}/>
                        </Box>

                        <Box sx={{ width: '15%', display: 'flex', flexDirection: 'row',
                            justifyContent: 'space-between', padding: 0 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker value={dayjs(task.startDateTime?.getDate())}
                                onChange={(newValue) => newValue ? task.startDateTime 
                                    = newValue.toDate() : null}
                                disableOpenPicker
                                sx={{
                                    width: '100%',
                                    input: {
                                        height: '100%',
                                        color: 'primary.contrastText',
                                        padding: 0,
                                        textAlign: 'center',
                                        backgroundColor: 'primary.light',
                                    },
                                    "& .MuiInputBase-root": {
                                        padding: 0,
                                        height: '100%',
                                    }
                                }}/>
                            </LocalizationProvider>
                            <Divider orientation='vertical' 
                            sx={{ backgroundColor: 'primary.contrastText', 
                                width: '1px',
                            }}/>
                        </Box>
                        <Box sx={{ width: '15%', display: 'flex', flexDirection: 'row',
                        justifyContent: 'flex-end', padding: 0 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker value={dayjs(task.endDateTime?.getDate())}
                                onChange={(newValue) => newValue ? task.endDateTime 
                                    = newValue.toDate() : null}
                                disableOpenPicker
                                sx={{
                                    width: '100%',
                                    input: {
                                        height: '100%',
                                        color: 'primary.contrastText',
                                        padding: 0,
                                        textAlign: 'center',
                                        backgroundColor: 'primary.light',
                                    },
                                    "& .MuiInputBase-root": {
                                        padding: 0,
                                        height: '100%',
                                    }
                                }}/>
                            </LocalizationProvider>
                            <Divider orientation='vertical' 
                            sx={{ backgroundColor: 'primary.contrastText', 
                                width: '1px',
                            }}/>
                        </Box>
                        <Box sx={{ width: '10%', display: 'flex', flexDirection: 'row',
                        justifyContent: 'center', padding: 0 }}>
                            <Checkbox checked={task.completed} onChange={() => {
                                task.completed = !task.completed;
                                updateTask(task);
                            }} 
                            sx={{ color: 'primary.contrastText',
                                '&.Mui-checked': {
                                    color: 'primary.contrastText'
                                }
                            }} />
                        </Box>
                    </Box>
                    <Divider orientation='horizontal' 
                        sx={{ width: '100%', height: '1px', 
                        backgroundColor: 'primary.contrastText' }} />
                    <Collapse in={expandedTasks.has(task.id)}
                    sx={{ width: '100%' }}>
                        <ExpandableTask parentId={task.id} paddingLeft={paddingLeft + 20}/>
                    {/* <Divider orientation='horizontal' 
                    sx={{ width: '100%', height: '1px', 
                    backgroundColor: 'primary.contrastText' }} /> */}
                    </Collapse>
                </Box>
            ))}
            <Button onClick={addTask}
            sx={{ 
                width: '100%', justifyContent: 'flex-start',
                backgroundColor: 'primary.dark', color: 'primary.contrastText',
                '&.MuiButton-root': {
                    padding: 0,
                    paddingTop: '3px', paddingBottom: '3px',
                }
            }}>
                <AddIcon sx={{ marginLeft: `${paddingLeft}px`, }} />
                <Typography 
                sx={{ marginLeft: '5px', textTransform: 'none'}}>
                    Add Task
                </Typography>
            </Button>
        </div>
    );
}

export default ExpandableTask;