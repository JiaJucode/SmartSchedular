import { Checkbox } from "@mui/material";
import { useEffect, useState } from "react";


interface LiveSyncCheckboxProps {
    task_id: number;
    fieldKey: string;
    value: boolean;
}

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const LiveSyncCheckbox: React.FC<LiveSyncCheckboxProps> = ({ task_id, fieldKey, value }) => {
    const [checked, setChecked] = useState<boolean>(value);

    useEffect(() => {
        setChecked(value);
    }, [task_id]);

    const onCheckboxChange = () => {
        fetch(`${server_base_url}/task/update_task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: task_id,
                [fieldKey]: !checked,
            }),
        })
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