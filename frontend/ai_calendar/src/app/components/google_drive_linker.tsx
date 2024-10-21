"use client";

import React, { useEffect } from 'react';
import { gapi } from 'gapi-script';
import { Button, Typography } from '@mui/material';

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const GoogleDriveLinker = () => {
    const [gapiLoaded, setGapiLoaded] = React.useState(false);
    const [accessToken, setAccessToken] = React.useState('');
    const [refreshToken, setRefreshToken] = React.useState('');
    const [idToken, setIdToken] = React.useState('');
    const [linking, setLinking] = React.useState(false);
    const [linked, setLinked] = React.useState(false);
    const [displayText, setDisplayText] = React.useState('Link Google Drive');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const loadGapi = async () => {
                gapi.load('client:auth2', () => {
                    gapi.auth2.init({
                        apiKey: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY,
                        clientId: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID,
                        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                        scope: 'https://www.googleapis.com/auth/drive',
                        accessType: 'offline',
                        prompt: 'consent',
                    }).then(() => {
                        setGapiLoaded(true);
                    });
                });
            }
            loadGapi();
        }
        fetch(`${server_base_url}/google/check_connected?user_id=${0}`, {
            method: 'GET',
        }).then((response) => response.json())
        .then((data) => {
            console.log('data:', data);
            if (data.connected) {
                setLinked(true);
                setDisplayText('Google Drive Linked');
            }
        });
    }, []);

    useEffect(() => {
        if (accessToken !== '' && refreshToken !== '' && idToken !== '') {
            setLinking(true);
            setDisplayText('Linking...');
            fetch(`${server_base_url}/google/setup_token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_token: idToken,
                    access_token: accessToken,
                    refresh_token: refreshToken,
                }),
            }).then((response) => {
                setLinking(false);
                console.log('response:', response);
                if (response.ok) {
                    setLinked(true);
                    setDisplayText('Google Drive Linked');
                    console.log('Google Drive linked successfully');
                } else {
                    setLinked(false);
                    setDisplayText('Link Google Drive');
                    console.log('Error linking Google Drive');
                }
            });
        }
    }, [accessToken, refreshToken]);

    const handleSignIn = () => {
        if (gapiLoaded) {
            const response = gapi.auth2.getAuthInstance()
            .currentUser.get().getAuthResponse();
            setIdToken(response.id_token);
            setAccessToken(response.access_token);
            gapi.auth2.getAuthInstance().grantOfflineAccess().then((authResult: any) => {
                setRefreshToken(authResult.code);
            });
        } else {
            console.log('Google API not loaded yet');
        }
    };
    
    return (
        <Button onClick={handleSignIn} disabled={linking || linked}>
            <Typography sx={{ fontSize: '1.2em', color: 'primary.contrastText', textTransform: 'none' }}>
                {displayText}
            </Typography>
            <img
                src="/google_drive_icon.ico"
                alt="Google Drive Icon"
                style={{ width: '30px', height: '30px', marginLeft: '5px' }}
            />
        </Button>
    );
};

export default GoogleDriveLinker;