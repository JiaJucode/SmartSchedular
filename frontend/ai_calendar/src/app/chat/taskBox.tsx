import Box from '@mui/material/Box';
import { Task } from '../tasks/page';
import React, { useEffect, useState } from 'react';
import { Button, TextField, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import * as taskApi from '../utils/task_api_funcs';
import { DocumentSegments } from '../chat/page';

type TaskBoxProps = {
    suggestedTasks: Task[];
    parentId: number;
    reference_docs: DocumentSegments;
}

const TaskBox: React.FC<TaskBoxProps> = ({suggestedTasks, parentId, reference_docs}) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [project_task, setProjectTask] = useState<Task[]>([]);
    const [realParentId, setRealParentId] = useState<number>(0);
    const [pendingExecutions, setPendingExecutions] = useState<Task[]>([]);

    useEffect(() => {
        if (parentId !== 0) {
            setTasks(suggestedTasks);
            setRealParentId(parentId);
        }
        else {
            setProjectTask([suggestedTasks[0]]);
            if (suggestedTasks.length > 1) {
                setTasks(suggestedTasks.slice(1));
            }
            else {
                setTasks([suggestedTasks[0]]);
            }
            setRealParentId(0);
        }
    }, [suggestedTasks, parentId, reference_docs]);

    useEffect(() => {
        if (project_task.length > 1) {
            setRealParentId(project_task[1].id);
        }
    }, [project_task]);

    useEffect(() => {
        if (pendingExecutions.length > 0 && realParentId !== 0) {
            taskApi.addTask(realParentId, setProjectTask, pendingExecutions[0], reference_docs);
            setPendingExecutions(pendingExecutions.slice(1));
        }
    }, [pendingExecutions, realParentId]);

    const handleDelete = (index: number) => {
        setTasks(prevTasks => prevTasks.filter((_, i) => i !== index));
    }

    const handleAdd = (index: number) => {
        // if parentId is 0, then setup the project task before adding the first task
        if (realParentId === 0 && project_task.length > 0) {
            taskApi.addTask(realParentId, setProjectTask, project_task[0]);
        }
        setPendingExecutions(prevExecutions => [...prevExecutions, tasks[index]]);
        setTasks(prevTasks => prevTasks.filter((_, i) => i !== index));

    }


    return (
        <Box>
            {tasks.map((task, index) => (
                <Box key={index}
                sx={{
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    display: 'flex',
                    width: '100%',
                    borderRadius: '10px',
                }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        height: '30px',
                        width: '100%',
                    }}>
                        <Button sx={{ width: '60px', height: '40px', 
                            margin: '5px', backgroundColor: 'primary.dark', 
                            color: 'primary.contrastText' }}
                            onClick = {() => handleDelete(index)}>
                            CANCEL
                        </Button>
                        <Button sx={{ width: '70px', height: '40px', 
                            margin: '5px', backgroundColor: 'primary.dark', 
                            color: 'primary.contrastText' }}
                            onClick = {() => handleAdd(index)}>
                            EXECUTE
                        </Button>
                    </Box>
                    <TextField
                        fullWidth variant='standard'
                        id='task'
                        value={task.title}
                        slotProps={{ 
                            input: {disableUnderline: true} }}
                        sx={{
                            width: '70%', 
                            margin: 'auto',
                            display: 'flex',
                            transform: 'translateY(-15px)',
                            input: {
                                color: 'primary.contrastText',
                                textAlign: 'center',
                                fontSize: '25px',
                            },
                        }}
                    />
                    {task.startDate !== null ? (
                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', 
                                width: '100%', paddingLeft: '5px', paddingRight: '5px', }}>
                            <Typography sx={{ fontSize: '15px', color: 'primary.contrastText', display: 'flex', alignItems: 'center' }}>
                                Start date:
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    disableOpenPicker
                                    value={dayjs(task.startDate)}
                                    onChange={(date) => {
                                        setTasks(prevTasks => prevTasks.map((task, i) => {
                                            if (i === index && date !== null) {
                                                task.startDate = date.toDate();
                                            }
                                            return task;
                                        }));
                                    }}
                                    sx={{
                                        width: '70%',
                                        height: '100%',
                                        input: {
                                            border: 'none',
                                            height: '40px',
                                            color: 'primary.contrastText',
                                            padding: 0,
                                            textAlign: 'center',
                                        },
                                    }}
                                    
                                />
                            </LocalizationProvider>
                        </Box>
                    ) : null}
                    {task.endDate !== null ? (
                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', 
                            width: '100%', paddingLeft: '5px', paddingRight: '5px', }}>
                        <Typography sx={{ fontSize: '15px', color: 'primary.contrastText', display: 'flex', alignItems: 'center' }}>
                            End date:
                        </Typography>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                disableOpenPicker
                                value={dayjs(task.endDate)}
                                onChange={(date) => {
                                    setTasks(prevTasks => prevTasks.map((task, i) => {
                                        if (i === index && date !== null) {
                                            task.endDate = date.toDate();
                                        }
                                        return task;
                                    }));
                                }}
                                sx={{
                                    width: '70%',
                                    height: '100%',
                                    input: {
                                        border: 'none',
                                        height: '40px',
                                        color: 'primary.contrastText',
                                        padding: 0,
                                        textAlign: 'center',
                                    },
                                }}
                                
                            />
                        </LocalizationProvider>
                        </Box>
                    ) : null}
                    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
                        width: '100%', paddingLeft: '5px', paddingRight: '5px', }}>
                        <Typography sx={{ fontSize: '15px', color: 'primary.contrastText', display: 'flex', alignItems: 'center' }}>
                            Priority:
                        </Typography>
                        <TextField
                            fullWidth variant='outlined'
                            id='priority'
                            value={task.priority}
                            onChange = {(e) => {
                                setTasks(prevTasks => prevTasks.map((task, i) => {
                                    if (i === index) {
                                        task.priority = e.target.value === "" ? 0 : parseInt(e.target.value);
                                    }
                                    return task;
                                }
                                ));
                            }}
                            sx={{
                                width: '70%',
                                height: '100%',
                                input: {
                                    border: 'none',
                                    height: '40px',
                                    color: 'primary.contrastText',
                                    padding: 0,
                                    textAlign: 'center',
                                },
                            }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
                        width: '100%', paddingLeft: '5px', paddingRight: '5px', }}>
                        <Typography sx={{ fontSize: '15px', color: 'primary.contrastText', display: 'flex', alignItems: 'center' }}>
                            Estimated time:
                        </Typography>
                        <TextField
                            fullWidth variant='outlined'
                            id='description'
                            value={task.estimatedTime}
                            onChange = {(e) => {
                                setTasks(prevTasks => prevTasks.map((task, i) => {
                                    if (i === index) {
                                        task.estimatedTime = e.target.value === "" ? 0 : parseInt(e.target.value);
                                    }
                                    return task;
                                }
                                ));
                            }}
                            sx={{
                                width: '70%',
                                height: '100%',
                                input: {
                                    border: 'none',
                                    height: '40px',
                                    color: 'primary.contrastText',
                                    padding: 0,
                                    textAlign: 'center',
                                },
                            }}
                        />
                    </Box>
                    
                    
                        
                    
                </Box>
            ))}
        </Box>
    )
};

export default TaskBox;