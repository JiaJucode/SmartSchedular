"use client";

import { Box, IconButton, Toolbar, Typography, Button, Stack, Menu, MenuItem } from "@mui/material"
import React from "react"
import { useState } from "react";
import Person4Icon from '@mui/icons-material/Person4';

const menuNavigation: Record<string, string> = {
    "Calendar": "/calendar",
    "Tasks": "/tasks",
    "Chat": "/chat",
}

const userSettingNav: Record<string, string> = {
    "Settings": "/settings",
    "Logout": "/logout",
}

const NavBar = () => {
    const [loggedIn, setLoggedIn] = useState(true);
    const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    return (
        <Box>
        <Toolbar sx={{ backgroundColor: 'primary.main' }}>
            <Box sx={{
                height: '100%',
                width: '25%',
                // backgroundColor: 'primary.light',
            }}>
                <IconButton edge="start" color="inherit" aria-label="menu">
                    <img src="/favicon.ico" alt="Custom Icon" 
                    style={{ width: '35px', height: '35px', filter: 'invert(1)' }} />
                    <Typography variant="h6" padding={1}>
                        AI Calendar
                    </Typography>
                </IconButton>
            </Box>
            <Box sx={{
                height: '100%',
                width: '30%',
            }}>
                <Stack spacing={4} direction={'row'} justifyContent={'center'}>
                    {Object.keys(menuNavigation).map((key) => (
                        <div key={key}>
                            <Button variant="text" color="primary" onClick={() => {
                                window.location.href = window.location.origin + menuNavigation[key];
                            }}>
                            <Typography fontSize={20} sx={{ textAlign: 'center', textTransform: 'none' }} 
                                color="primary.contrastText">
                                {key}
                            </Typography>
                            </Button>
                        </div>
                    ))}
                </Stack>
            </Box>
            <Box sx={{
                height: '100%',
                width: '45%',
                display: 'flex',
                justifyContent: 'flex-end',
            }}>
                <IconButton 
                    aria-controls={userMenuOpen ? 'user-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={userMenuOpen ? 'true' : undefined}
                onClick={(event) => {
                    setUserMenuAnchor(event.currentTarget);
                    setUserMenuOpen(true);
                }}>
                    <Person4Icon sx={{ color: 'primary.contrastText' }} />
                </IconButton>
                <Menu 
                    id="user-menu"
                    anchorEl={userMenuAnchor}
                    open={userMenuOpen}
                    MenuListProps={{
                        'aria-labelledby': 'user-menu',
                    }}
                    onClose={() => {
                        setUserMenuAnchor(null);
                        setUserMenuOpen(false);
                    }}
                    sx={{
                        '& .MuiPaper-root': {
                            backgroundColor: 'primary.light',
                            color: 'primary.contrastText',
                        },
                    }}
                >
                    {loggedIn ?
                        Object.keys(userSettingNav).map((key) => (
                            <MenuItem key={key} onClick={() => {
                                if (key === "Logout") {
                                    setLoggedIn(false);
                                }
                                else {
                                    window.location.href = window.location.origin + userSettingNav[key];
                                }
                            }}>
                                {key}
                            </MenuItem>
                        )) :
                        <MenuItem onClick={() => {
                            window.location.href = "/login";
                        }}>
                            Login
                        </MenuItem>


                    }
                </Menu>


                
            </Box>
            
        </Toolbar>
        </Box>
    );
};

export default NavBar;