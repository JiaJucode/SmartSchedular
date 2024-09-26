import React, { useEffect, useState } from "react";
import { Box, Paper, Stack, Divider, Typography } from '@mui/material';

interface DayProps {
    date: Date;
    setDate: React.Dispatch<React.SetStateAction<Date>>;
}

const exampleEvents = [
    {
        title: "Event 1",
        date: new Date(),
    },
    {
        title: "Event 2",
        date: new Date(),
    },
    {
        title: "Event 3",
        date: new Date(),
    },
];

const timeBlockCount = 25;

const DayComponent: React.FC<DayProps> = ({date, setDate}) => {
    const [events, setEvents] = useState<{title: string, date: Date}[]>(exampleEvents);

	return (
		<Stack 
        spacing={'70px'}
        sx={{
            flexDirection: 'column',
            alignItems: 'flex-end',
            padding: '10px',
            height: '100%',
            overflowY: 'auto',
            backgroundColor: 'primary.main',
        }}>
			{Array.from({length: timeBlockCount}, (_, i) => (
                <Box key={i}
                sx={{ 
                    width: '100%', 
                    flexDirection: 'row', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent:'space-between' }}>
                    <Typography sx={{ paddingLeft: '30px'}}>
                        {i}:00
                    </Typography>
                    <Divider key={i} 
                    sx={{ 
                        backgroundColor: 'primary.contrastText', 
                        width: '90%', 
                        height: '1px',
                    }} />
                </Box>
            ))}
        </Stack>
	);
};

export default DayComponent;