"use client";

import React from 'react';
import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AssistantIcon from '@mui/icons-material/Assistant';
import {IconButton, InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Task } from '../tasks/page';
import { Event } from '../calendar/day';
import TaskBox from './taskBox';

interface ChatMessage {
    isUser: boolean;
    message: string
    tasks?: {tasks: Task[], parentId: number}
    events?: Event[];
}

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const welcomeMessage = 'Welcome! You can add, update, delete, or ' + 
'list tasks and events, or ask for help. Please provide more context ' + 
'so I can assist you better.';

const testChatMessages: ChatMessage[] = [
    {isUser: false, message: 'Hello! How can I help you today?'},
    {isUser: true, message: 'I need to finish with my course work by tmr midnight.'},
    {
        isUser: false, 
        message: 'I see. Here are some tasks that you can do to finish your course work:',
        tasks: {
            tasks: [
                {
                    id: -1,
                    title: 'Finish homework',
                    description: 'Finish homework for all courses',
                    startDate: new Date(),
                    endDate: new Date(),
                    priority: 1,
                    estimatedTime: 8,
                    completed: false,
                    hoursToSchedule: 0,
                },
                {
                    id: -2,
                    title: 'Study for exam',
                    description: 'Study for exam for all courses',
                    startDate: new Date(),
                    endDate: new Date(),
                    priority: 1,
                    estimatedTime: 8,
                    completed: false,
                    hoursToSchedule: 0,
                }
            ],
            parentId: 0,
        }
    },
    {isUser: true, message: 'I have a meeting with my professor at 3pm tomorrow.'},
    {
        isUser: false,
        message: 'I have added the event to your calendar. Here are the details:',
        events: [
            {
                id: -1,
                title: 'Meeting with Professor',
                tags: [],
                description: 'Meeting with Professor',
                startDateTime: new Date(),
                endDateTime: new Date(),
            }
        ]
    },
];
    

const ChatPage = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([{isUser: false, message: welcomeMessage}]);
    const [message, setMessage] = useState('');
    const chatBottomRef = useRef<HTMLDivElement>(null);
    const [replyWaiting, setReplyWaiting] = useState(false);

    useEffect(() => {
        // Fetch chat list from backend
        setMessages(testChatMessages);
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const sendRequest = () => {
        setMessages(prevMessages => [...prevMessages, {isUser: true, message: message}]);
        setReplyWaiting(true);
        // TODO: get response from backend
        fetch(`${server_base_url}/chat/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                current_date: new Date().toISOString()
            })
        })
        .then((response) => response.json())
        .then((data: any) => {
            console.log(data);
            if ('response' in data) {
                console.log(data.response);
                const response = data.response;
                const content = response.content;
                switch (response.action_type) {
                    case 'question':
                        setMessages(prevMessages => [...prevMessages, {isUser: false, message: content.response}]);
                        break;
                    case 'chat':
                        setMessages(prevMessages => [...prevMessages, {isUser: false, message: content.message}]);
                        break;
                    case 'task':
                        setMessages(prevMessages => [...prevMessages, {isUser: false, message: content.message,
                            parentId: content.parentId, tasks: content.tasks.map((task: any) => {
                                return {
                                    id: task.id,
                                    title: task.title,
                                    description: task.description,
                                    startDate: new Date(task.start_date),
                                    endDate: new Date(task.end_date),
                                    priority: task.priority,
                                    estimatedTime: task.estimated_time,
                                    completed: task.completed,
                                    hoursToSchedule: task.estimated_time,
                                }
                            }
                        )}]);
                        break;
                    case 'calendar':
                        setMessages(prevMessages => [...prevMessages, {isUser: false, message: content.message,
                            events: content.events.map((event: any) => {
                                return {
                                    id: event.id,
                                    title: event.title,
                                    tags: event.tags,
                                    description: event.description,
                                    startDateTime: new Date(event.start_date),
                                    endDateTime: new Date(event.end_date),
                                }
                            }
                        )}]);
                    default:
                        // TODO: render calendar event or task
                        break;
                }
            }
            else {
                // TODO: handle error
            }
            chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
        setReplyWaiting(false);
        setMessage('');
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' && message.length && !event.shiftKey && !event.ctrlKey) {
            sendRequest();
            event.preventDefault();
        }
    }

    return (
        <Box
            sx={{
                backgroundColor: 'primary.dark',
                width: '100%',
                height: 'calc(100vh - 119px)',
                paddingBottom: '70px',
                overflowY: 'auto',
                justifyContent: 'center',
                display: 'flex',
            }}>
                    <Stack spacing={2} direction="column" alignItems="center"
                        sx={{ width: '100%', marginBottom: '70px' }}>
                        {messages.map((message, index) => (
                            <Box
                                key={index}
                                sx={{
                                    justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                                    display: 'flex',
                                    width: '70%',
                                    flexDirection: 'column',
                                    paddingLeft: message.isUser ? '10%' : '0',
                                    paddingRight: message.isUser ? '0' : '10%',
                                    transform: !message.isUser ? 'translateY(-30px)' : 'none',
                                }}
                            >
                                {!message.isUser ? (
                                    <AssistantIcon sx={{ marginLeft: '-10%', fontSize: 50, padding: 0.2,
                                        position: 'sticky', transform: 'translateY(40px)' }} />
                                ) : null}
                                <Typography variant='h5' align={message.isUser ? 'right' : 'left'}
                                    sx = {{ paddingBottom: '10px' }}>
                                    {message.message}
                                </Typography>
                                {message.tasks !== undefined ? (
                                    <TaskBox 
                                        suggestedTasks={message.tasks.tasks} 
                                        parentId={message.tasks.parentId}/>
                                ) : message.events !== undefined ? (
                                    <Box></Box>
                                ) : null
                                }
                            </Box>
                        ))}
                    </Stack>
                    <div ref={chatBottomRef} />
                    <Box sx={{ width: '90%', height: '65px', display: 'flex', justifyContent: 'center',
                        backgroundColor: 'primary.dark', position: 'fixed', bottom: 0
                     }}>
                    <TextField variant='standard' multiline fullWidth value={message} 
                        disabled={replyWaiting}
                        onKeyDown={(e) => handleKeyDown(e)}
                        onChange={(e) => setMessage(e.target.value)}
                        slotProps={{
                            input: {
                                disableUnderline: true,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={sendRequest}>
                                            <SearchIcon sx={{ color: 'white' }} />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }
                        }}
                        sx={{
                            position: 'fixed',
                            bottom: 10, width: '70%',
                            height: '55px',
                            // marginLeft: '15%',
                            padding: 1,
                            opacity: 0.99,
                            borderRadius: 7,
                            backgroundColor: 'primary.light',
                            '& .MuiInputBase-input': {
                                fontSize: 25, // Apply font size to the input text
                                color: 'primary.contrastText',
                            },
                            '& .MuiOutlinedInput-root.Mui-disabled': {
                                // backgroundColor: 'primary.main',
                                // borderRadius: 7,
                            }
                        }}/>
                    </Box>
        </Box>
    );
}

export default ChatPage;