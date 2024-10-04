import { Checkbox } from "@mui/material";
import { useEffect, useState } from "react";
import { updateTask } from "../utils/task_api_funcs";


interface LiveSyncCheckboxProps {
    task_id: number;
    fieldKey: string;
    value: boolean;
}

const LiveSyncCheckbox: React.FC<LiveSyncCheckboxProps> = ({ task_id, fieldKey, value }) => {
    const [checked, setChecked] = useState<boolean>(value);

    useEffect(() => {
        setChecked(value);
    }, [task_id]);

    const onCheckboxChange = () => {
        updateTask(task_id, fieldKey, !checked);
        setChecked(!checked);
    }

    return (
        <Checkbox checked={checked} onChange={onCheckboxChange}
            sx={{ color: 'primary.contrastText',
                '&.Mui-checked': {
                    color: 'primary.contrastText'
                }
        }} />
    );
}

export default LiveSyncCheckbox;