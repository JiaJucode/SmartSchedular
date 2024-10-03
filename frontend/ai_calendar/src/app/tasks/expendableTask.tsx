import React, { useEffect, useState, Suspense } from 'react';
import { Task } from '../tasks/page';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import { Box, Button, Collapse, Divider, Typography, IconButton, TextField, InputAdornment } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import Checkbox from '@mui/material/Checkbox';
import LiveSyncTextfield from './live_sync_textfield';
import LiveSyncDatePicker from './live_sync_date_picker';

interface ExpandableTaskProps {
    parentId: number;
    paddingLeft: number;
    openInfo: (task: Task) => void;
}

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const ExpandableTask: React.FC<ExpandableTaskProps> = ({parentId, paddingLeft, openInfo}) => {
    const [expandedTasks, setExpandedTasks] = useState(new Set<number>());
    // temp buffer for server updates
    const [localDate, setLocalDate] = useState<Date>(new Date());
    const [edited, setEdited] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        fetch(`${server_base_url}/task/get_tasks?parent_id=${parentId}`)
            .then((response) => response.json())
            .then((data: {tasks: {id: number, title: string, description: string,
                start_datetime: string, end_datetime: string, priority: number,
                estimated_time: number, completed: boolean}[]
            }) => {
                setTasks(data.tasks.map((task) => ({
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
    }, [parentId]);

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
                priority: 0,
                estimated_time: 0,
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
                    priority: 0,
                    estimatedTime: null,
                    completed: false,
                }];
            });
        });
    }

    const updateCheckboxes = (id: number, checked: boolean) => {
        setTasks((prevTasks) => {
            return prevTasks.map((task) => {
                if (task.id === id) {
                    return {...task, completed: checked};
                }
                return task;
            });
        });
        fetch(`${server_base_url}/task/update_task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: id,
                completed: checked,
            }),
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
                            <Checkbox checked={task.completed} onChange={() => 
                            updateCheckboxes(task.id, !task.completed)}
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
                            <LiveSyncTextfield task_id={task.id} value={task.title}
                            fieldKey='title' numberOnly={false} />
                            <IconButton onClick={() => {openInfo(task)}}
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
                            value={task.startDate} />
                            <Divider orientation='vertical'
                            sx={{ backgroundColor: 'primary.contrastText', width: '1px', zIndex: 2 }} />
                        </Box>
                        <Box sx={{ width: '10%', display: 'flex', flexDirection: 'row',
                            justifyContent: 'flex-end', position: 'relative' }}>
                            <LiveSyncDatePicker task_id={task.id} fieldKey='endDate'
                            value={task.endDate} />
                            <Divider orientation='vertical'
                            sx={{ backgroundColor: 'primary.contrastText', width: '1px', zIndex: 2 }} />
                        </Box>
                        <Box sx={{ width: '10%', display: 'flex', flexDirection: 'row',
                            justifyContent: 'flex-end', position: 'relative' }}>
                            <LiveSyncTextfield task_id={task.id} fieldKey='priority'
                            value={task.priority !== null ? task.priority.toString() : ""}
                            numberOnly />
                            <Divider orientation='vertical'
                            sx={{ backgroundColor: 'primary.contrastText', width: '1px', zIndex: 2 }} />
                        </Box>
                        <Box sx={{ width: '10%', display: 'flex', flexDirection: 'row',
                            justifyContent: 'flex-end', position: 'relative' }}>
                            <LiveSyncTextfield task_id={task.id} fieldKey='estimatedTime'
                            value={task.estimatedTime !== null ? task.estimatedTime.toString() : ""}
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
                                openInfo={openInfo} />
                            </Suspense>
                        ) : null}
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
                    {paddingLeft === 0 ? "Add Task" : "Add Subtask"}
                </Typography>
            </Button>
        </Box>
    );
}

export default ExpandableTask;