"use client";

import React, { useEffect, useState } from 'react';
import SideBar from '../components/side_bar';
import { Box, Button, Divider, Stack, Toolbar, Typography } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ExpandableTask from '../components/expendableTask';
import AddIcon from '@mui/icons-material/Add';

export interface Task {
    id: number;
    title: string;
    description: string;
    startDate: Date | null;
    endDate: Date | null;
    completed: boolean;
}

const tableSettings = {
    title: {headerName: 'Task Name', width: '70%'},
    startDate: {headerName: 'Start Date', width: '15%'},
    endDate: {headerName: 'End Date', width: '15%'},
}

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const TasksPage = () => {
    const [hideSideBar, setHideSideBar] = useState(false);
    const [delayedHide, setDelayedHide] = useState(false);
    const [googleDriveLinked, setGoogleDriveLinked] = useState(false);
    const [projects, setProjects] = useState<Task[]>([]);
    const [selectedProject, setSelectedProject] = useState<number>(-1);

    useEffect(() => {
        // TODO: check if account is linked to google drive
        // fetch projects from backend
        fetch(`${server_base_url}/task/get_tasks?parent_id=0`)
            .then((response) => response.json())
            .then((data: {tasks: {id: number, title: string, description: string,
                start_datetime: Date | null, end_datetime: Date | null,
                completed: boolean}[]}) => {
                setProjects(data.tasks.map((task) => ({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    startDate: task.start_datetime,
                    endDate: task.end_datetime,
                    completed: task.completed,
                })));
            });
    }, []);

    const addProject = () => {
        let project_id = 0;
        fetch(`${server_base_url}/task/add_task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                parent_id: 0,
                title: 'New Project',
                description: 'This is a new project',
                start_datetime: null,
                end_datetime: null,
                completed: false,
            }),})
            .then((response) => response.json())
            .then((data: {id: number}) => {
                project_id = data.id;
                setProjects([...projects, {
                    id: project_id,
                    title: 'New Project',
                    description: 'This is a new project',
                    startDate: null,
                    endDate: null,
                    completed: false,
                }]);
            });
    }

    return (
        <Box sx={{ width: '100vw', display: 'flex', flexDirection: 'row', 
            justifyContent: 'space-between', overflow: 'visible', overflowY: 'hidden'}}>
            <SideBar hide={hideSideBar} setHide={setHideSideBar} currentHide={delayedHide}
            setCurrentHide={setDelayedHide}>
                <Stack
                sx={{
                    width: '100%',
                    height: '100%',
                }}>
                    <Button color="inherit" sx={{ textTransform: 'none' }}>
                        <Typography sx={{ fontSize: '1.2em' }}>
                            File upload
                        </Typography>
                        <FileUploadIcon />
                    </Button>
                    {!googleDriveLinked ? (
                        <Button color="inherit" sx={{ textTransform: 'none' }}>
                            <Typography sx={{ fontSize: '1.2em' }}>
                                Link Google Drive 
                            </Typography>   
                            <img src="/google_drive_icon.ico" alt="Google Drive Icon"
                            style={{ width: '30px', height: '30px', marginLeft: '5px'}} />
                        </Button>
                    ) : null}
                    <Divider sx={{ backgroundColor: 'primary.contrastText', 
                        width: "95%", marginLeft: "2.5%" }} />
                    <Typography sx={{ fontSize: '1.2em', marginLeft: '10px', marginTop: '5px' }}>
                        Projects:
                    </Typography>
                    {projects.map((project) => (
                        <Button key={project.id} color="inherit" 
                        sx={{ textTransform: 'none' }}
                        onClick={() => setSelectedProject(project.id)}>
                            <Typography sx={{ fontSize: '1.2em' }}>
                                {project.title}
                            </Typography>
                        </Button>
                    ))}
                    <Button onClick={addProject}
                    sx={{ 
                        width: '100%', justifyContent: 'flex-start',
                        color: 'primary.contrastText',
                        '&.MuiButton-root': {
                            padding: 0,
                            paddingTop: '3px', paddingBottom: '3px',
                        }
                    }}>
                        <AddIcon sx={{ marginLeft: `10px`, }} />
                        <Typography 
                        sx={{ marginLeft: '5px', textTransform: 'none'}}>
                            Add Task
                        </Typography>
                    </Button>

                </Stack>
            </SideBar>
            <Box sx={{ 
                width: delayedHide ? '100vw' : 'calc(100vw - 330px)',
                position: 'relative',
                overflowY: 'hidden',
                height: '93vh',
                paddingLeft: '1px',
            }}>
                <Toolbar variant='dense' disableGutters
                sx={{ flexDirection: "column", width: '100%', padding: '0px' }}>
                    <Box sx={{ justifyContent: 'space-between', height: '40px', 
                        alignItems: 'center', display: 'flex', backgroundColor: 'primary.main',
                        width: '100%'
                    }}>
                        page tool bar
                    </Box>
                    <Divider sx={{ backgroundColor: 'primary.contrastText', width: '100%' }} />
                    <Box sx={{ justifyContent: 'space-between', height: '20px',
                        width: '100%', alignItems: 'center', display: 'flex'
                    }}>

                        {Object.values(tableSettings).map((info, index) => (
                            <Box key={index} sx={{ 
                                width: info.width,
                                height: '100%',
                                flexDirection: 'row',
                                display: 'flex',
                            }}>
                                <Typography align='center'
                                sx={{ 
                                    textOverflow: 'ellipsis',
                                    overflowX: 'hidden',
                                    color: 'primary.contrastText',
                                    width: '100%' }}>
                                    {info.headerName}
                                </Typography>
                                {index !== Object.entries(tableSettings).length - 1 ?
                                <Divider orientation='vertical'
                                sx={{ 
                                    backgroundColor: 'primary.contrastText', 
                                    width: '1px',
                                    height: '20px',
                                    left: '0px',
                                }} />
                                : null}
                            </Box>
                        ))}
                    </Box>
                    <Divider sx={{ backgroundColor: 'primary.contrastText', width: '100%' }} />
                </Toolbar>
                {selectedProject !== -1? (
                    <Box>
                        <ExpandableTask parentId={selectedProject}
                        paddingLeft={0} />
                    </Box>)
                : null}
            </Box>
        </Box>
    );
};

export default TasksPage;