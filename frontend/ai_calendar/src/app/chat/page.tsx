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

interface ChatBox {
    name: string;
    messages: string[];
}

interface ChatMessage {
    isUser: boolean;
    message: string;
}

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const ChatPage = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const chatBottomRef = useRef<HTMLDivElement>(null);
    const [replyWaiting, setReplyWaiting] = useState(false);

    useEffect(() => {
        // Fetch chat list from backend
    }, []);

    const sendRequest = () => {
        setMessages([...messages, {isUser: true, message}]);
        setReplyWaiting(true);
        // TODO: get response from backend


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
                height: '100dvh',
                paddingBottom: 7,
                overflowY: 'auto',
                // justifyContent: 'center',
                // display: 'flex',
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
                                    padding: 2,
                                }}
                            >
                                {!message.isUser ? (
                                    <AssistantIcon sx={{ marginLeft: '-5%', padding: 1, fontSize: 50 }} />
                                ) : null}
                                <Typography variant='h5'>
                                    {message.message}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                    <div ref={chatBottomRef} />
                    <Box sx={{ width: '100%', height: '70px', display: 'flex', justifyContent: 'center',
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
                                backgroundColor: 'primary.main',
                                borderRadius: 7,
                            }
                        }}/>
                    </Box>
        </Box>
    );
}

export default ChatPage;