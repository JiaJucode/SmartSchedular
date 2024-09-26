"use client";

import React, { useEffect } from 'react';
import { Box, Button, IconButton } from '@mui/material';
import { useState } from 'react';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';

interface SideBarProps {
    hide: boolean;
    setHide: (value: boolean) => void;
    currentHide: boolean;
    setCurrentHide: (value: boolean) => void;
    children: React.ReactNode;
}

const SideBar: React.FC<SideBarProps> = ({ children, hide, setHide, currentHide, setCurrentHide }) => {

    const handleButton = (setValue: boolean) => {
        setHide(setValue);
        if (setValue) {
            setTimeout(() => {
                setCurrentHide(setValue);
            }, 500);
        }
        else {
            setCurrentHide(setValue);
        }
    }

    return (
        <Box sx={{ 
            width: currentHide ? '40px' : '330px',
            height: '100%',
            display: 'flex', 
            transform: hide ? 'translateX(-100%)' : 'translateX(0%)',
            transition: 'transform 0.5s ease',
            position: 'relative',
            flexDirection: 'row' }}>
            {currentHide ? 
                <Box>
                    <Button onClick={() => handleButton(false)}
                        sx={{
                            backgroundColor: 'primary.light',
                            color: 'primary.contrastText',
                            paddingLeft: '40px',
                        }}>
                            
                        <KeyboardDoubleArrowRightIcon />
                    </Button>
                </Box> 
                :
                <Box sx={{
                        height: '100%',
                        width: '100%',
                        backgroundColor: 'primary.light',
                        paddingLeft: '10px',
                    }}>
                        <Box sx={{
                            width: '100%',
                            justifyContent: 'flex-end',
                            display: 'flex',
                        }}>
                            <Button onClick={() => handleButton(true)}
                                sx={{
                                    right: '5px',
                                    color: 'primary.contrastText',
                                }}>
                                <KeyboardDoubleArrowLeftIcon />
                            </Button>
                        </Box>
                        {children}
                </Box>
            }
        </Box>
    );
}

export default SideBar;