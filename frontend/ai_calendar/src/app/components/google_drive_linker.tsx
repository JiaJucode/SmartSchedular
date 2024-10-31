"use client";

import React, { useEffect } from 'react';
import { Button, Typography } from '@mui/material';

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const GoogleDriveLinker = () => {
    const [googleClient, setGoogleClient] = React.useState<any>(null);
    const [linking, setLinking] = React.useState(false);
    const [linked, setLinked] = React.useState(false);
    const [displayText, setDisplayText] = React.useState('Link Google Drive');

    const handleCallaback = (response: any) => {
        console.log('response:', response);
        fetch(`${server_base_url}/google/setup_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: response.code,
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
    };

    useEffect(() => {
        const client = google.accounts.oauth2.initCodeClient({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive',
            callback: handleCallaback,
        })
        setGoogleClient(client);
        fetch(`${server_base_url}/google/check_connected?userId=${0}`, {
            method: 'GET',
        }).then((response) => response.json())
        .then((data) => {
            if (data.connected) {
                setLinked(true);
                setDisplayText('Google Drive Linked');
            }
        });
    }, []);

    const handleSignIn = () => {
        if (googleClient) {
            googleClient.requestCode();
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