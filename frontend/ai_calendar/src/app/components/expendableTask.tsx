import React, { useEffect, useState } from 'react';
import { Task } from '../tasks/page';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
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

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const ExpandableTask: React.FC<ExpandableTaskProps> = ({parentId, paddingLeft}) => {
    const [expandedTasks, setExpandedTasks] = useState(new Set<number>());
    const [edited, setEdited] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        fetch(`${server_base_url}/task/get_tasks?parent_id=${parentId}`)
            .then((response) => response.json())
            .then((data: {tasks: {id: number, title: string, description: string,
                start_datetime: Date | null, end_datetime: Date | null,
                completed: boolean}[]}) => {
                setTasks(data.tasks.map((task) => ({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    startDate: task.start_datetime,
                    endDate: task.end_datetime,
                    completed: task.completed,
                })));
            });
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

        fetch(`${server_base_url}/task/add_task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                parent_id: parentId,
                title: 'new task',
                description: '',
                start_datetime: null,
                end_datetime: null,
                completed: false,
            }),
        }
        ).then((response) => response.json())
        .then((data: {id: number}) => {
            setTasks((prevTasks) => {
                return [...prevTasks, {
                    id: data.id,
                    title: 'new task',
                    description: '',
                    startDate: null,
                    endDate: null,
                    completed: false,
                }];
            });
        });
    }

    const updateTask = (task: Task) => {
        setTasks((prevTasks) => {
            const newTasks = [...prevTasks];
            const index = newTasks.findIndex((t) => t.id === task.id);
            if (newTasks[index] === task) {
                return newTasks;
            }
            else {
                newTasks[index] = task;
                setEdited(true);
                return newTasks;
            }
        });
    }

    const saveUpdatedTask = (task: Task) => {
        if (edited) {
            // TODO: send request to backend to update task
            setEdited(false);
        }
    }

    return (
        <div>
            {tasks.map((task) => (
                <Box key={task.id}
                sx={{ backgroundColor: `${expandedTasks.has(task.id)
                        ? 'primary.light' : 'primary.dark'}`,
                    color: 'primary.contrastText'}}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', height: '40px' }}>
                        <Box sx={{ width: '70%',
                            display: 'flex', flexDirection: 'row', paddingLeft: `${paddingLeft}px`,
                            '&.MuiButton-root': {
                                margin: 0,
                            }
                        }}>
                            <Checkbox checked={task.completed} onChange={() => {
                                task.completed = !task.completed;
                                updateTask(task);
                                saveUpdatedTask(task);
                            }} 
                            sx={{ color: 'primary.contrastText',
                                '&.Mui-checked': {
                                    color: 'primary.contrastText'
                                }
                            }} />
                            <IconButton onClick={() => handleToggle(task.id)}
                            sx={{ justifyContent: 'flex-start', padding: 0,
                                color: 'primary.contrastText'
                            }}>
                                {expandedTasks.has(task.id) 
                                ? <ArrowDropDownIcon /> 
                                : <ArrowRightIcon />}
                            </IconButton>
                            <TextField value={task.title} fullWidth variant='standard'
                            slotProps={{ 
                                input: {disableUnderline: true} }}
                            onChange={(e) => {
                                    task.title = e.target.value;
                                    updateTask(task);}}
                            onBlur={() => saveUpdatedTask(task)}
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
                            <IconButton onClick={() => {console.log('info')}}
                            sx={{ color: 'primary.contrastText' }}>
                                <InfoIcon />
                                {/* TODO: make info right side bar*/}
                            </IconButton>
                            <Divider orientation='vertical' 
                            sx={{ backgroundColor: 'primary.contrastText', 
                                width: '1px',
                            }}/>
                        </Box>

                        <Box sx={{ width: '15%', display: 'flex', flexDirection: 'row',
                            justifyContent: 'space-between', padding: 0 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker value={dayjs(task.startDate?.getDate())}
                                onChange={(newValue) => {
                                    newValue ? task.startDate = newValue.toDate() : null;
                                    updateTask(task);
                                }}
                                slotProps={{ 
                                    textField: {onBlur: () => {saveUpdatedTask(task)},}
                                }}
                                disableOpenPicker
                                sx={{
                                    width: '100%',
                                    input: {
                                        height: '100%',
                                        color: 'primary.contrastText',
                                        padding: 0,
                                        textAlign: 'center',
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
                                <DatePicker value={dayjs(task.endDate?.getDate())}
                                onChange={(newValue) => {
                                    newValue ? task.startDate = newValue.toDate() : null;
                                    updateTask(task);
                                }}
                                slotProps={{ 
                                    textField: {onBlur: () => {saveUpdatedTask(task)},}
                                }}
                                disableOpenPicker
                                sx={{
                                    width: '100%',
                                    input: {
                                        height: '100%',
                                        color: 'primary.contrastText',
                                        padding: 0,
                                        textAlign: 'center',
                                    },
                                    "& .MuiInputBase-root": {
                                        padding: 0,
                                        height: '100%',
                                    }
                                }}/>
                            </LocalizationProvider>
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