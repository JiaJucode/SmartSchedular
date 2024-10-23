import React, { useEffect, useState } from 'react';
import { TextField } from '@mui/material';
import { updateTask } from '../utils/task_api_funcs';

interface LiveSyncTextfieldProps {
    task_id: number;
    fieldKey: string;
    textValue: string | null;
    setTextValue: (value: string) => void;
    numberOnly: boolean;
}

const LiveSyncTextfield: React.FC<LiveSyncTextfieldProps> = ({ task_id, fieldKey, textValue, setTextValue,
    numberOnly = false }) => {
    const [oldTextValue, setOldTextValue] = useState<string | null>(textValue);

    useEffect(() => {
        setOldTextValue(textValue);
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
                    if (numberOnly) {
                        console.log(e.target.value);
                        setTextValue(e.target.value === "" ? "0" :
                            parseInt(e.target.value).toString());
                    }
                    else {
                        setTextValue(e.target.value);
                    }
                }}}
        onBlur={() => {
            if (textValue !== oldTextValue) {
                saveUpdatedTask(task_id);
                setOldTextValue(textValue);
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