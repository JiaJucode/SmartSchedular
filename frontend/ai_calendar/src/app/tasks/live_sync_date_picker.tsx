import { Typography } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { updateTask } from "../utils/task_api_funcs";


interface LiveSyncDatePickerProps {
    task_id: number;
    fieldKey: string;
    dateValue: Date | null;
    setDateValue: (value: Date | null) => void;
}

const LiveSyncDatePicker: React.FC<LiveSyncDatePickerProps> = ({ task_id, fieldKey, dateValue, setDateValue }) => {
    const [oldDateValue, setOldDateValue] = useState<Date | null>(dateValue);

    useEffect(() => {
        setOldDateValue(dateValue);
    }, [task_id]);

    const saveUpdatedTask = () => {
        updateTask(task_id, fieldKey, dateValue);
    }                

    return (
        <div>
        { !dateValue ? (
            <Typography align='center'
            sx={{
                position: 'absolute', zIndex: 1,
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                textOverflow: 'ellipsis', backgroundColor: 'primary.dark',
                pointerEvents: 'none', 
            }}>
                No Date Selected
            </Typography>
        ) : null}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker value={dayjs(dateValue)}
            format="DD/MM/YYYY"
            onChange={(newValue) => {
                if (newValue !== null && newValue.toDate() !== dateValue) {
                    setDateValue(newValue.toDate());
                }
            }}
            slotProps={{ 
                textField: {
                    placeholder: dateValue === null ? '' : 'No Date Selected',
                    onBlur: () => {
                        if (dateValue?.getTime() !== oldDateValue?.getTime()) {
                            saveUpdatedTask();
                            setOldDateValue(dateValue);
                        }},
                    onFocus: () => {
                        if (dateValue === null) {
                            setDateValue(new Date(new Date().setHours(0, 0, 0, 0)));
                        }
                    }
                },
            }}
            disableOpenPicker
            sx={{
                width: '100%',
                height: '100%',
                input: {
                    border: 'none',
                    height: '100%',
                    color: 'primary.contrastText',
                    padding: 0,
                    textAlign: 'center',
                },
                '& .MuiInputBase-root': {
                    border: 'none',
                    padding: 0,
                    height: '100%',
                },
            }}/>
        </LocalizationProvider>
        </div>
    )
}

export default LiveSyncDatePicker;