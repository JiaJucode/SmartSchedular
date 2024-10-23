import React, { useEffect, useState, Suspense } from 'react';
import { Task } from '../tasks/page';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { Box, Button, Collapse, Divider, Typography, IconButton } from '@mui/material';
import LiveSyncTextfield from './live_sync_textfield';
import LiveSyncDatePicker from './live_sync_date_picker';
import LiveSyncCheckbox from './live_sync_checkbox';
import { fetchTasks, addTask } from '../utils/task_api_funcs';
import * as taskApi from '../utils/task_api_funcs';

// TODO: sync with live components

interface ExpandableTaskProps {
    parentId: number;
    paddingLeft: number;
    setSetRefresh: React.Dispatch<React.SetStateAction<() => void>>;
    openInfo: (task: Task, setTask: (task: Task) => void) => void;
}

const ExpandableTask: React.FC<ExpandableTaskProps> = ({parentId, paddingLeft, setSetRefresh, openInfo}) => {
    const [expandedTasks, setExpandedTasks] = useState(new Set<number>());
    // temp buffer for server updates
    const [tasks, setTasks] = useState<Task[]>([]);
    const [refresh, setRefresh] = useState(false);

    useEffect(() => {
        console.log('fetching tasks');
        fetchTasks(parentId, setTasks);
    }, [parentId, refresh]);

    const handleToggle = (id: number) => {
        const newExpandedTasks = new Set(expandedTasks);
        if (expandedTasks.has(id)) {
            newExpandedTasks.delete(id);
        } else {
            newExpandedTasks.add(id);
        }
        setExpandedTasks(newExpandedTasks);
    }

    const handleSchedule = (id: number, hoursLeft: number | null) => {
        if (hoursLeft === 0) {
            taskApi.descheduleTask(id);
            setTasks(prevTasks => {
                return prevTasks.map((task) => {
                    if (task.id === id) {
                        task.hoursToSchedule = null;
                    }
                    return task;
                });
            });
        }
        else {
            const timeLeft = taskApi.scheduleTask(id);
            setTasks(prevTasks => {
                return prevTasks.map((task) => {
                    if (task.id === id) {
                        task.hoursToSchedule = timeLeft;
                    }
                    return task;
                });
            });
        }
        console.log('updated_task:', tasks);
    }

    const handleInfoClick = (task_id: number) => {
        const task = tasks.find((task) => task.id === task_id);
        if (task) {
            openInfo(task, (task: Task) => {
                setTasks(prevTasks => {
                    return prevTasks.map((t) => {
                        if (t.id === task.id) {
                            return task;
                        }
                        return t;
                    });
                });
            });
        }
    }

    const updateChecked = (task_id: number, checked: boolean) => {
        setTasks(prevTasks => {
            return prevTasks.map((task) => {
                if (task.id === task_id) {
                    task.completed = checked;
                }
                return task;
            });
        });
    }

    const updateTaskTitle = (task_id: number, title: string) => {
        setTasks(prevTasks => {
            return prevTasks.map((task) => {
                if (task.id === task_id) {
                    task.title = title;
                }
                return task;
            });
        });
    }

    const updateTaskDate = (task_id: number, date: Date | null, startDate: boolean) => {
        setTasks(prevTasks => {
            return prevTasks.map((task) => {
                if (task.id === task_id) {
                    if (startDate) {
                        task.startDate = date;
                    } else {
                        task.endDate = date;
                    }
                }
                return task;
            });
        });
    }

    const updateTaskPriority = (task_id: number, priority: number) => {
        setTasks(prevTasks => {
            return prevTasks.map((task) => {
                if (task.id === task_id) {
                    task.priority = priority;
                }
                return task;
            });
        });
    }

    const updateTaskEstimatedTime = (task_id: number, estimatedTime: number) => {
        setTasks(prevTasks => {
            return prevTasks.map((task) => {
                if (task.id === task_id) {
                    task.estimatedTime = estimatedTime;
                }
                return task;
            });
        });
    }


    return (
        <Box sx={{ overflowY: 'auto', width: '100%', height: '100%' }}>
            {tasks.map((task) => (
                <Box key={task.id}
                sx={{ backgroundColor: `${expandedTasks.has(task.id)
                        ? 'primary.light' : 'primary.dark'}`,
                    color: 'primary.contrastText'}}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', height: '40px' }}>
                        <Box sx={{ width: '60%',
                            display: 'flex', flexDirection: 'row', paddingLeft: `${paddingLeft}px`,
                            '&.MuiButton-root': {
                                margin: 0,
                            }
                        }}>
                            <LiveSyncCheckbox task_id={task.id} fieldKey='completed'
                            checked={task.completed} setChecked={(checked) => updateChecked(task.id, checked)} />
                            <Button onClick={() => handleSchedule(task.id, task.hoursToSchedule)}
                            sx={{ justifyContent: 'center', color: 'primary.contrastText',
                                minWidth: '40px', alignContent: 'center', display: 'flex',
                                justifyItems: 'center', alignItems: 'center',
                                // if task is not scheduled, no background color
                                backgroundColor: task.hoursToSchedule === 0 
                                && task.estimatedTime !== null ?
                                    'primary.light' : 'primary.dark',
                            }}>
                                <ScheduleIcon />
                            </Button>
                            <IconButton onClick={() => handleToggle(task.id)}
                            sx={{ justifyContent: 'flex-start', padding: 0,
                                color: 'primary.contrastText',
                            }}>
                                {expandedTasks.has(task.id) 
                                ? <ArrowDropDownIcon /> 
                                : <ArrowRightIcon />}
                            </IconButton>
                            <LiveSyncTextfield task_id={task.id} textValue={task.title}
                            setTextValue={(title) => updateTaskTitle(task.id, title)}
                            fieldKey='title' numberOnly={false} />
                            <IconButton onClick={() => {handleInfoClick(task.id);
                            setSetRefresh(() => () => {
                                setRefresh(!refresh)
                            });}}
                            sx={{ color: 'primary.contrastText' }}>
                                <InfoIcon />
                            </IconButton>
                            <Divider orientation='vertical' 
                            sx={{ backgroundColor: 'primary.contrastText', 
                                width: '1px',
                            }}/>
                        </Box>

                        <Box sx={{ width: '10%', display: 'flex', flexDirection: 'row',
                            justifyContent: 'flex-end', position: 'relative' }}>
                            <LiveSyncDatePicker task_id={task.id} fieldKey='startDate'
                            dateValue={task.startDate} setDateValue={(date) => updateTaskDate(task.id, date, true)} />
                            <Divider orientation='vertical'
                            sx={{ backgroundColor: 'primary.contrastText', width: '1px', zIndex: 2 }} />
                        </Box>
                        <Box sx={{ width: '10%', display: 'flex', flexDirection: 'row',
                            justifyContent: 'flex-end', position: 'relative' }}>
                            <LiveSyncDatePicker task_id={task.id} fieldKey='endDate'
                            dateValue={task.endDate} setDateValue={(date) => updateTaskDate(task.id, date, false)} />
                            <Divider orientation='vertical'
                            sx={{ backgroundColor: 'primary.contrastText', width: '1px', zIndex: 2 }} />
                        </Box>
                        <Box sx={{ width: '10%', display: 'flex', flexDirection: 'row',
                            justifyContent: 'flex-end', position: 'relative' }}>
                            <LiveSyncTextfield task_id={task.id} fieldKey='priority'
                            textValue={task.priority !== null ? task.priority.toString() : ""}
                            setTextValue={(priority) => updateTaskPriority(task.id, parseInt(priority))}
                            numberOnly />
                            <Divider orientation='vertical'
                            sx={{ backgroundColor: 'primary.contrastText', width: '1px', zIndex: 2 }} />
                        </Box>
                        <Box sx={{ width: '10%', display: 'flex', flexDirection: 'row',
                            justifyContent: 'flex-end', position: 'relative' }}>
                            <LiveSyncTextfield task_id={task.id} fieldKey='estimatedTime'
                            setTextValue={(time) => updateTaskEstimatedTime(task.id, parseInt(time))}
                            textValue={task.estimatedTime !== null ? task.estimatedTime.toString() : ""}
                            numberOnly />
                        </Box>
                    </Box>
                    <Divider orientation='horizontal' 
                        sx={{ width: '100%', height: '1px', 
                        backgroundColor: 'primary.contrastText' }} />
                    <Collapse in={expandedTasks.has(task.id)}
                    sx={{ width: '100%' }}>
                        {expandedTasks.has(task.id) ? (
                            <Suspense fallback={<div>Loading...</div>}>
                                <ExpandableTask parentId={task.id} paddingLeft={paddingLeft + 20}
                                setSetRefresh={setSetRefresh} openInfo={openInfo}/>
                            </Suspense>
                        ) : null}
                    </Collapse>
                </Box>
            ))}
            <Button onClick={() => addTask(parentId, setTasks)}
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
                    {paddingLeft === 0 ? "Add Task" : "Add Subtask"}
                </Typography>
            </Button>
        </Box>
    );
}

export default ExpandableTask;