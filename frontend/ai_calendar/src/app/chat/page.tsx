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
import CalendarBox from './calendarBox';

interface ChatMessage {
    tag: string;
    isUser: boolean;
    message: string
    parentId?: number;
    tasks?: Task[];
    events?: Event[];
}

export interface DocumentSegment {
    id: number;
    segment_range: [number, number];
}

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const welcomeMessage = 'Welcome! You can add, update, delete, or ' + 
'list tasks and events, or ask for help. Please provide more context ' + 
'so I can assist you better.';

const ChatPage = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([{isUser: false, tag: 'intro', message: welcomeMessage}]);
    const [hiddenContext, setHiddenContext] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const chatBottomRef = useRef<HTMLDivElement>(null);
    const [replyWaiting, setReplyWaiting] = useState(false);
    const [chatTags, setChatTags] = useState<string[]>([]);
    const [currentDocuments, setCurrentDocuments] = useState<DocumentSegment[]>([]);

    useEffect(() => {
        // setMessages(testChatMessages);
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        console.log("messages: ", messages);
    }, [messages]);

    const sendRequest = () => {
        const lastTag = messages[messages.length - 1].tag;
        setMessages(prevMessages => [...prevMessages, {isUser: true, tag: lastTag, message: message}]);
        setHiddenContext(prevContext => [...prevContext, ""]);
        setReplyWaiting(true);
        let context = 'Chat History: ';
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].tag === lastTag) {
                context += JSON.stringify(messages[i]);
                if (hiddenContext[i] !== "") {
                    context += "\n" + "chat context: " + hiddenContext[i];
                }
            }
        }
        fetch(`${server_base_url}/chat/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                allTags: chatTags,
                currentDate: new Date().toISOString(),
                context: context,
            })
        })
        .then((response) => response.json())
        .then((data: any) => {
            console.log(data);
            if ('response' in data) {
                console.log(data.response);
                const response = data.response;
                const content = response.content;
                if (!(response.tag in chatTags)) {
                    setChatTags(prevTags => [...prevTags, response.tag]);
                }
                switch (response.action_type) {
                    case 'question':
                        setMessages(prevMessages => [...prevMessages, 
                            {isUser: false, tag: response.tag, message: content.response}]);
                        break;
                    case 'chat':
                        setMessages(prevMessages => [...prevMessages, 
                            {isUser: false, tag: response.tag, message: content.response}]);
                        break;
                    case 'task':
                        console.log("content: ", content);
                        console.log("parent id: ", content.parent_id);
                        setMessages(prevMessages => [...prevMessages, 
                            {isUser: false, tag: response.tag, message: content.message,
                                parentId: content.parent_id, tasks: content.tasks.map((item: any) => {
                                    return {
                                        id: item.task.id,
                                        title: item.task.title,
                                        description: item.task.description,
                                        startDate: new Date(item.task.start_date),
                                        endDate: new Date(item.task.end_date),
                                        priority: item.task.priority,
                                        estimatedTime: item.task.estimated_time,
                                        completed: item.task.completed,
                                        hoursToSchedule: item.task.estimated_time,
                                    }
                            }
                        )}]);
                        break;
                    case 'calendar':
                        setMessages(prevMessages => [...prevMessages, 
                            {isUser: false, tag: response.tag, message: content.message,
                            events: content.events.map((item: any) => {
                                return {
                                    id: item.event.id,
                                    title: item.event.title,
                                    tags: item.event.tags,
                                    description: item.event.description,
                                    startDateTime: new Date(item.event.start_date),
                                    endDateTime: new Date(item.event.end_date),
                                }
                            }
                        )}]);
                    default:
                        break;
                }
                if ('context' in response) {
                    setHiddenContext(prevContext => [...prevContext, response.context]);
                }
                if ('document_ids' in response) {
                    // TODO: parse the reponse
                    console.log(response.document_ids);
                    setCurrentDocuments(response.document_ids);
                }
                else {
                    setCurrentDocuments([]);
                }
            }
            else {
                // TODO: handle error
                console.log('Error in response');
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
                                    paddingBottom: '20px',
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
                                {message.tasks !== undefined && message.parentId !== undefined ? (
                                    <TaskBox 
                                        suggestedTasks={message.tasks} 
                                        parentId={message.parentId}
                                        reference_docs={currentDocuments}
                                        />
                                ) : message.events !== undefined ? (
                                    <CalendarBox suggestedEvents={message.events} 
                                    reference_docs={currentDocuments} />
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
                            minheight: '55px',
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