"use client";

import React from 'react';
import { Box, Button, Drawer } from '@mui/material';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';

interface SideBarProps {
    children: React.ReactNode;
    open: boolean;
    setOpen: (value: boolean) => void;
}

const SideBar: React.FC<SideBarProps> = ({ children, open, setOpen }) => {


    return (
        <Drawer open={open} onClose={() => setOpen(false)} variant='persistent' 
        anchor='left' sx={{ marginTop: '64px', zIndex: 1 }}>
                <Box sx={{
                        marginTop: '64px',
                        height: '100%',
                        width: '300px',
                        backgroundColor: 'primary.light',
                        color: 'primary.contrastText',
                    }}>
                        <Box sx={{
                            width: '100%',
                            justifyContent: 'flex-end',
                            display: 'flex',
                        }}>
                            <Button onClick={() => {setOpen(false)}}
                                sx={{
                                    right: '5px',
                                    color: 'primary.contrastText',
                                }}>
                                <KeyboardDoubleArrowLeftIcon />
                            </Button>
                        </Box>

                        {children}
                </Box>
        </Drawer>
    );
}

export default SideBar;