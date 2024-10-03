"use client";

// TODO implement file upload
import React, { useEffect, useState } from 'react';
import SideBar from '../components/side_bar';
import { Box, Button, Divider, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ExpandableTask from './expendableTask';
import AddIcon from '@mui/icons-material/Add';
import TaskInfoSideBar from './task_info_side_bar';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';

export interface Task {
    id: number;
    title: string;
    description: string;
    startDate: Date | null;
    endDate: Date | null;
    priority: number;
    estimatedTime: number | null;
    completed: boolean;
}

const tableSettings = {
    title: {headerName: 'Task Name', width: '60%'},
    startDate: {headerName: 'Start Date', width: '10%'},
    endDate: {headerName: 'End Date', width: '10%'},
    priority: {headerName: 'Priority', width: '10%'},
    estimatedTime: {headerName: 'Estimated Time', width: '10%'},
}

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const TasksPage = () => {
    const [openSideBar, setOpenSideBar] = useState(true);
    const [googleDriveLinked, setGoogleDriveLinked] = useState(false);
    const [projects, setProjects] = useState<Task[]>([]);
    const [selectedProject, setSelectedProject] = useState<number>(1);
    const [infoSiderOpen, setInfoSiderOpen] = useState(false);
    const [infoTask, setInfoTask] = useState<Task | null>(null);

    useEffect(() => {
        // TODO: check if account is linked to google drive
        // fetch projects from backend
        fetch(`${server_base_url}/task/get_tasks?parent_id=0`)
            .then((response) => response.json())
            .then((data: {tasks: {id: number, title: string, description: string,
                start_datetime: Date | null, end_datetime: Date | null,
                priority: number, estimated_time: number | null, completed: boolean
            }[]}) => {
                setProjects(data.tasks.map((task) => ({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    startDate: task.start_datetime,
                    endDate: task.end_datetime,
                    priority: task.priority,
                    estimatedTime: task.estimated_time,
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
                priority: 0,
                estimated_time: null,
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
                    priority: 0,
                    estimatedTime: null,
                    completed: false,
                }]);
            });
    }

    const openInfo = (task: Task) => {
        setInfoTask(task);
        setInfoSiderOpen(true);
    }

    return (
        <Box sx={{ width: '100vw', display: 'flex', flexDirection: 'row', 
            justifyContent: 'space-between', overflow: 'visible', overflowY: 'hidden'}}>
            <Box sx={{ 
                width: '100vw',
                position: 'relative',
                overflowY: 'hidden',
                height: '93vh',
                paddingLeft: openSideBar ? '301px' : '0px',
            }}>
                <Toolbar variant='dense' disableGutters
                sx={{ flexDirection: "column", width: '100%', padding: '0px'}}>
                    <Box sx={{ justifyContent: 'space-between', height: '40px', 
                        alignItems: 'center', display: 'flex', backgroundColor: 'primary.main',
                        width: '100%'
                    }}>
                        {/* TODO: add filter */}
                        { !openSideBar ? (
                            <Button onClick={() => setOpenSideBar(!openSideBar)}
                            sx={{ 
                                position: 'absolute',
                                color: 'primary.contrastText', 
                                backgroundColor: 'primary.light',
                                borderRadius: '20px',
                                height: '40px',
                                left: '-25px',
                                top: '0px',
                                '&:hover': {
                                    backgroundColor: 'primary.light',
                                },
                                '&.MuiButtonBase-root': {
                                    paddingRight: '0px',
                                    paddingLeft: '0px',
                                }
                            }}>
                                <KeyboardDoubleArrowRightIcon sx={{ 
                                paddingLeft: '0px', right: '5px', fontSize: '1.5em',
                                position: 'absolute'}} />
                            </Button>
                        )
                        : null}
                        
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
                    <Box sx={{ width: '100%', height: 'calc(100% - 60px)', overflowY: 'auto', 
                        paddingBottom: '15px'}}>
                        <ExpandableTask parentId={selectedProject}
                        paddingLeft={0} openInfo={openInfo}/>
                    </Box>)
                : null}
            </Box>
            {infoTask === null ? null :
            <TaskInfoSideBar task={infoTask} openSideBar={infoSiderOpen}
            setOpenSideBar={setInfoSiderOpen} />}
            
            <SideBar open={openSideBar} setOpen={setOpenSideBar}>
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
        </Box>
    );
};

export default TasksPage;