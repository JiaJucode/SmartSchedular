import React from 'react';
import { TextField } from '@mui/material';

interface LiveSyncTextfieldProps {
    task_id: number;
    fieldKey: string;
    value: string;
    updateTask: (id: number, update_param: {[key: string]: string | number}) => void;
    saveUpdatedTask: (task_id: number) => void;
    numberOnly: boolean;
}

const LiveSyncTextfield: React.FC<LiveSyncTextfieldProps> = ({ task_id, fieldKey, value, 
    updateTask, saveUpdatedTask, numberOnly = false }) => {
    return (
        <TextField value={value !== null ? value : ""} 
        fullWidth variant='standard'
        slotProps={{ 
            input: {disableUnderline: true} }}
        onChange={(e) => {
                updateTask(task_id, { [fieldKey]: numberOnly ?
                    parseInt(e.target.value) : e.target.value });}}
        onBlur={() => saveUpdatedTask(task_id)}
        sx={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            flexGrow: 1, textOverflow: 'ellipsis', padding: 1,
            input: {
                color: 'primary.contrastText',
                textAlign: 'center',
            },
            '&.MuiTextField-root' : {
                margin: 0,
            },
        }}/>
    )
}

export default LiveSyncTextfield;