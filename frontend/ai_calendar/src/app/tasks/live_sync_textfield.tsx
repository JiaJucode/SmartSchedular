import React, { useState } from 'react';
import { TextField } from '@mui/material';

interface LiveSyncTextfieldProps {
    task_id: number;
    fieldKey: string;
    value: string;
    numberOnly: boolean;
}

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const LiveSyncTextfield: React.FC<LiveSyncTextfieldProps> = ({ task_id, fieldKey, value, 
    numberOnly = false }) => {
    const [textValue, setTextValue] = useState<string | null>(value);
    const [valueChanged, setValueChanged] = useState<boolean>(false);

    const saveUpdatedTask = (task_id: number) => {
        console.log(`Updating task ${task_id} with ${fieldKey} = ${textValue}`);
        fetch(`${server_base_url}/task/update_task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: task_id,
                [fieldKey]: textValue,
            }),
        })
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