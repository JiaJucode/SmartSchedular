import Box from '@mui/material/Box';
import { Task } from '../tasks/page';
import React, { use, useEffect, useState } from 'react';
import { Button } from '@mui/material';


type TaskBoxProps = {
    suggestedTasks: Task[];
}

const TaskBox: React.FC<TaskBoxProps> = ({suggestedTasks}) => {
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        setTasks(suggestedTasks);
    }, [suggestedTasks]);

    const handleDelete = (index: number) => {
        setTasks(tasks.filter((task, i) => i !== index));
    }

    const handleAdd = (index: number) => {
        // send add task request to backend
        setTasks(tasks.filter((task, i) => i !== index));
    }


    return (
        <Box>
            {tasks.map((task, index) => (
                <Box key={index}
                sx={{
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    flexDirection: 'column',
                    display: 'flex',
                    width: '100%',
                    borderRadius: '10px',
                }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        height: '300px',
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
                    
                        
                    
                </Box>
            ))}
        </Box>
    )
};

export default TaskBox;