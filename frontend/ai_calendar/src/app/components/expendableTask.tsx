import React, { useState } from 'react';
import { Task } from '../tasks/page';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Collapse, Divider, Typography, IconButton } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import Checkbox from '@mui/material/Checkbox';

interface ExpandableTaskProps {
    task: Task[];
    editTask: (task: Task) => void;
    paddingLeft: number;
}

const ExpandableTask: React.FC<ExpandableTaskProps> = ({task, editTask, paddingLeft}) => {
    const [expandedTasks, setExpandedTasks] = useState(new Set<number>());

    const handleToggle = (id: number) => {
        const newExpandedTasks = new Set(expandedTasks);
        if (expandedTasks.has(id)) {
            newExpandedTasks.delete(id);
        } else {
            newExpandedTasks.add(id);
        }
        setExpandedTasks(newExpandedTasks);
    }

    return (
        <div>
            {task.map((task) => (
                <Box sx={{ backgroundColor: `${expandedTasks.has(task.id)
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
                            <Typography sx={{ marginLeft: 1, display: 'flex',
                                justifyContent: 'flex-start', alignItems: 'center',
                                flexGrow: 1, textOverflow: 'ellipsis', overflowX: 'hidden',
                            }}>
                                {task.name}
                            </Typography>
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
                                editTask(task);
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
                        <ExpandableTask task={task.subtasks} paddingLeft={paddingLeft + 20} 
                        editTask={editTask} />
                        <Button sx={{ 
                            width: '100%', justifyContent: 'flex-start',
                            backgroundColor: 'primary.dark', color: 'primary.contrastText',
                            '&.MuiButton-root': {
                                padding: 0,
                            }
                        }}>
                        <AddIcon sx={{ marginLeft: `${paddingLeft}px`, }} />
                        <Typography 
                        sx={{ marginLeft: '5px', textTransform: 'none'}}>
                            Add Task
                        </Typography>
                    </Button>
                    <Divider orientation='horizontal' 
                    sx={{ width: '100%', height: '1px', 
                    backgroundColor: 'primary.contrastText' }} />
                    </Collapse>
                </Box>
            ))}
        </div>
    );
}

export default ExpandableTask;