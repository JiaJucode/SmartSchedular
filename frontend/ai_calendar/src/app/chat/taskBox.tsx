import Box from '@mui/material/Box';
import { Task } from '../tasks/page';
import React, { useEffect, useState } from 'react';
import { Button, TextField, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import * as taskApi from '../utils/task_api_funcs';

type TaskBoxProps = {
    suggestedTasks: Task[];
    parentId: number;
}

const TaskBox: React.FC<TaskBoxProps> = ({suggestedTasks, parentId}) => {
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        setTasks(suggestedTasks);
    }, [suggestedTasks]);

    const handleDelete = (index: number) => {
        setTasks(tasks.filter((task, i) => i !== index));
    }

    const handleAdd = (index: number) => {
        // TODO: send add task request to backend
        taskApi.addTask(parentId, (() => {}), tasks[index]);
        setTasks(tasks.filter((_, i) => i !== index));
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
                            DELETE
                        </Button>
                        <Button sx={{ width: '60px', height: '40px', 
                            margin: '5px', backgroundColor: 'primary.dark', 
                            color: 'primary.contrastText' }}
                            onClick = {() => handleAdd(index)}>
                            ADD
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
                                        // send update task request to backend
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
                                    // send update task request to backend
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
                                setTasks(tasks.map((task, i) => {
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
                                setTasks(tasks.map((task, i) => {
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