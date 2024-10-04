import React, { useEffect, useState } from 'react';
import { TextField } from '@mui/material';
import { updateTask } from '../utils/task_api_funcs';

interface LiveSyncTextfieldProps {
    task_id: number;
    fieldKey: string;
    value: string | null;
    numberOnly: boolean;
}

const LiveSyncTextfield: React.FC<LiveSyncTextfieldProps> = ({ task_id, fieldKey, value, 
    numberOnly = false }) => {
    const [textValue, setTextValue] = useState<string | null>(value);
    const [valueChanged, setValueChanged] = useState<boolean>(false);

    useEffect(() => {
        setTextValue(value);
    }, [task_id]);

    const saveUpdatedTask = (task_id: number) => {
        updateTask(task_id, fieldKey, textValue);
    }                

    return (
        <TextField value={textValue !== null ? textValue : ""} 
        fullWidth variant='standard'
        slotProps={{ 
            input: {disableUnderline: true} }}
        onChange={(e) => {
                if (e.target.value !== textValue) {
                    numberOnly ? setTextValue(parseInt(e.target.value).toString()) 
                    : setTextValue(e.target.value);
                    setValueChanged(true);
                }}}
        onBlur={() => {
            if (valueChanged) {
                saveUpdatedTask(task_id);
                setValueChanged(false);
            }}}
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