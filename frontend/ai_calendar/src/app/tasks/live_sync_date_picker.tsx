import { Typography } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useState } from "react";


interface LiveSyncDatePickerProps {
    task_id: number;
    fieldKey: string;
    value: Date | null;
}

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const LiveSyncDatePicker: React.FC<LiveSyncDatePickerProps> = ({ task_id, fieldKey, value }) => {
    const [dateValue, setDateValue] = useState<Date | null>(value);
    const [valueChanged, setValueChanged] = useState<boolean>(false);

    const saveUpdatedTask = () => {
        console.log(`Updating task ${task_id} with ${fieldKey} = ${dateValue}`);
        fetch(`${server_base_url}/task/update_task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: task_id,
                [fieldKey]: dateValue,
            }),
        })
    }                

    return (
        <div>
        { !dateValue ? (
            <Typography align='center'
            sx={{
                position: 'absolute', zIndex: 1,
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', textOverflow: 'ellipsis', 
                backgroundColor: 'primary.dark', pointerEvents: 'none', 
            }}>
                No Date Selected
            </Typography>
        ) : null}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker value={dayjs(dateValue)}
            onChange={(newValue) => {
                if (newValue?.toDate() !== dateValue) {
                    setValueChanged(true);
                }
            }}
            slotProps={{ 
                textField: {
                    placeholder: value === null ? '' : 'No Date Selected',
                    onBlur: () => {
                        if (valueChanged) {
                            saveUpdatedTask();
                            setValueChanged(false);
                        }},
                    onFocus: () => {
                        if (dateValue === null) {
                            setDateValue(new Date());
                        }
                    }
                },
            }}
            disableOpenPicker
            sx={{
                width: '100%',
                height: '100%',
                input: {
                    height: '100%',
                    color: 'primary.contrastText',
                    padding: 0,
                    textAlign: 'center',
                },
                '& .MuiInputBase-root': {
                    padding: 0,
                    height: '100%',
                },
            }}/>
        </LocalizationProvider>
        </div>
    )
}

export default LiveSyncDatePicker;