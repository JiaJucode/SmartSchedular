import React, { createRef, useEffect, useState } from "react";
import { Box, Button, Stack, Divider, Typography, Menu } from '@mui/material';
import CreateEvent from "./create_event";

interface DayProps {
    date: Date;
    setDate: React.Dispatch<React.SetStateAction<Date>>;
}

const timeBlockCount = 25;

interface Event {
    title: string;
    startDateTime: Date;
    Tags: string[];
    endDateTime: Date;
    description: string;
}

const exampleEvents: Event[] = [
    {
        title: "Event 1",
        startDateTime: new Date(2022, 2, 1, 9),
        endDateTime: new Date(2022, 2, 1, 10),
        Tags: ["Google Drive"],
        description: "Event 1 description",
    },
    {
        title: "Event 2",
        startDateTime: new Date(2022, 2, 1, 14),
        endDateTime: new Date(2022, 2, 1, 15),
        Tags: ["Google Drive"],
        description: "Event 2 description",
    },
    {
        title: "Event 3",
        startDateTime: new Date(2022, 2, 1, 17),
        endDateTime: new Date(2022, 2, 1, 18),
        Tags: ["Google Drive"],
        description: "Event 3 description",
    },
];

const DayComponent: React.FC<DayProps> = ({date, setDate}) => {
    const [events, setEvents] = useState<Event[]>(exampleEvents);
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [eventStartTime, setEventStartTime] = useState(new Date());
    const [eventCreationAnchor, setEventCreationAnchor] = useState<null | HTMLElement>(null);
    
    const addToEvents = (title: string, startDateTime: Date, 
        endDateTime: Date, description: string) => {
        setEvents([...events, {
            title: title,
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            Tags: ["Google Drive"],
            description: description,
        }]);
    }

    const handleTimeBlockClick = (time: number, event: React.MouseEvent<HTMLButtonElement>) => {
        setDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), time));
        setIsCreatingEvent(true);
        setEventStartTime(new Date(date.getFullYear(), date.getMonth(), date.getDate(), time));
        setEventCreationAnchor(event.currentTarget);
    }
	return (
		<Stack 
        sx={{
            flexDirection: 'column',
            alignItems: 'flex-end',
            height: '100%',
            overflowY: 'auto',
            width: '100%',
            marginTop: '10px',
            position: 'relative',
        }}>
			{Array.from({length: timeBlockCount}, (_, i) => (
                <Box key={i}
                sx={{ 
                    width: '100%', 
                    flexDirection: 'row', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent:'space-between' }}>
                    <Typography sx={{ paddingLeft: '4%'}}>
                        {i}:00
                    </Typography>
                    <Box 
                    sx={{
                        flexDirection: 'column',
                        marginRight: '40px',
                        width: '87%',

                    }}>
                        <Divider key={i} 
                        sx={{ 
                            backgroundColor: 'primary.contrastText', 
                            height: '1px',
                            width: '88%',
                            marginTop: '35px',
                            position: 'absolute',
                            zIndex: 1,
                        }} />

                        <Button variant='text'
                        onClick={(event) => {handleTimeBlockClick(i, event)}}
                        sx={{
                            width: '100%',
                            height: '70px',
                        }}/>
                        <Menu
                            anchorEl={eventCreationAnchor}
                            open={isCreatingEvent}
                            onClose={() => setIsCreatingEvent(false)}
                            MenuListProps={{ sx: { py: 0 } }}
                            >
                            <Box sx={{ width: '500px', height: '300px', 
                                backgroundColor: 'primary.light',
                                color: 'primary.contrastText',
                                }}>
                                <CreateEvent 
                                    eventStartTime={eventStartTime} 
                                    setEventStartTime={setEventStartTime} 
                                    addToEvents={addToEvents}
                                    closeCreateEvent={() => setIsCreatingEvent(false)}
                                />
                            </Box>
                        </Menu>
                    </Box>
                </Box>
            ))}
        </Stack>
	);
};

export default DayComponent;