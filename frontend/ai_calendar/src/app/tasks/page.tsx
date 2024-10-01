"use client";

import React, { useEffect, useState } from 'react';
import SideBar from '../components/side_bar';
import { Box, Button, Divider, Stack, Toolbar, Typography } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ExpandableTask from '../components/expendableTask';

export interface Task {
    id: number;
    name: string;
    description: string;
    startDateTime: Date | null;
    endDateTime: Date | null;
    completed: boolean;
    subtasks: Task[];
}

interface Project {
    id: number;
    name: string;
    tasks: Task[];
}

const exampleProjects: Project[] = [
    {
        id: 1,
        name: 'Project 1',
        tasks: [
            {
                id: 1,
                name: 'Task 1',
                description: 'Description 1',
                startDateTime: new Date(2021, 10, 1),
                endDateTime: new Date(2021, 10, 2),
                completed: false,
                subtasks: [
                    {
                        id: 5,
                        name: 'Subtask 1',
                        description: 'Description 1',
                        startDateTime: new Date(2021, 10, 1),
                        endDateTime: new Date(2021, 10, 2),
                        completed: false,
                        subtasks: [],
                    }],
            },
            {
                id: 2,
                name: 'Task 2',
                description: 'Description 2',
                startDateTime: new Date(2021, 10, 3),
                endDateTime: new Date(2021, 10, 4),
                completed: false,
                subtasks: [],
            },
        ],
    },
    {
        id: 2,
        name: 'Project 2',
        tasks: [
            {
                id: 3,
                name: 'Task 3',
                description: 'Description 3',
                startDateTime: new Date(2021, 10, 5),
                endDateTime: new Date(2021, 10, 6),
                completed: false,
                subtasks: [],
            },
            {
                id: 4,
                name: 'Task 4',
                description: 'Description 4',
                startDateTime: new Date(2021, 10, 7),
                endDateTime: new Date(2021, 10, 8),
                completed: false,
                subtasks: [],
            },
        ],
    },
];

const tableSettings = {
    name: {headerName: 'Task Name', width: '60%'},
    startDate: {headerName: 'Start Date', width: '15%'},
    endDate: {headerName: 'End Date', width: '15%'},
    completed: {headerName: 'Completed', width: '10%'},
}

const TasksPage = () => {
    const [hideSideBar, setHideSideBar] = useState(false);
    const [delayedHide, setDelayedHide] = useState(false);
    const [googleDriveLinked, setGoogleDriveLinked] = useState(false);
    const [projects, setProjects] = useState<Project[]>(exampleProjects);
    const [selectedProject, setSelectedProject] = useState<number>(1);

    useEffect(() => {
        // TODO: check if account is linked to google drive
        // TODO: fetch projects from backend
    }, []);

    const editTask = (task: Task) => {
        setProjects((prevProjects) => {
            const newProjects = [...prevProjects];
            const projectIndex = newProjects.findIndex((project) => project.id === selectedProject);
            const taskIndex = newProjects[projectIndex].tasks.findIndex((t) => t.id === task.id);
            newProjects[projectIndex].tasks[taskIndex] = task;
            return newProjects;
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
                                {project.name}
                            </Typography>
                        </Button>
                    ))}

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
                <Box>
                    <ExpandableTask task={projects[selectedProject - 1].tasks} 
                    paddingLeft={0} editTask={editTask}/>
                </Box>
            </Box>
        </Box>
    );
};

export default TasksPage;