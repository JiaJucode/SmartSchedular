"use client";

// TODO implement file upload
import React, { useEffect, useState } from 'react';
import SideBar from '../components/side_bar';
import { Box, Button, Divider, Stack, Toolbar, Typography } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ExpandableTask from './expendableTask';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import TaskInfoSideBar from './task_info_side_bar';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import * as taskApi from '../utils/task_api_funcs';
import dynamic from 'next/dynamic';
import LiveSyncTextfield from './live_sync_textfield';
const GoogleDriveLinker = dynamic(() => import('../components/google_drive_linker'), { ssr: false });


export interface Task {
    id: number;
    title: string;
    description: string;
    startDate: Date | null;
    endDate: Date | null;
    priority: number;
    estimatedTime: number | null;
    hoursToSchedule: number | null;
    completed: boolean;
}

const tableSettings = {
    title: {headerName: 'Task Name', width: '60%'},
    startDate: {headerName: 'Start Date', width: '10%'},
    endDate: {headerName: 'End Date', width: '10%'},
    priority: {headerName: 'Priority', width: '10%'},
    estimatedTime: {headerName: 'Estimated Time', width: '10%'},
}

const TasksPage = () => {
    const [openSideBar, setOpenSideBar] = useState(true);
    const [googleDriveLinked, setGoogleDriveLinked] = useState(false);
    const [projects, setProjects] = useState<Task[]>([]);
    const [selectedProject, setSelectedProject] = useState<number>(-1);
    const [infoSiderOpen, setInfoSiderOpen] = useState(false);
    const [infoTask, setInfoTask] = useState<Task | null>(null);
    const [updateInfoTask, setUpdateInfoTask] = useState<(task: Task) => void>(() => () => {console.log('old')});
    const [setRefresh, setSetRefresh] = useState<() => void>(() => () => {console.log('old')});

    useEffect(() => {
        taskApi.fetchTasks(0, setProjects);
    }, []);

    useEffect(() => {
        if (selectedProject === -1 && projects.length > 0) {
            setSelectedProject(projects[0].id);
        }
    }, [projects]);

    const openInfo = (task: Task, setTask: (task: Task) => void) => {
        setInfoTask(task);
        setUpdateInfoTask(() => setTask);
        setInfoSiderOpen(true);
    }

    const deleteProject = (project_id: number) => {
        taskApi.deleteTask(project_id, setProjects);
        if (selectedProject === project_id) {
            setSelectedProject(-1);
        }
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
                        <ExpandableTask parentId={selectedProject} setSetRefresh={setSetRefresh}
                        paddingLeft={0} openInfo={openInfo}/>
                    </Box>)
                : null}
            </Box>
            {infoTask === null ? null :
            <TaskInfoSideBar currentTask={infoTask} setCurrentTask={updateInfoTask} openSideBar={infoSiderOpen}
            setOpenSideBar={setInfoSiderOpen} setRefresh={() => setRefresh()} />}
            
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
                        <GoogleDriveLinker />
                    ) : null}
                    <Divider sx={{ backgroundColor: 'primary.contrastText', 
                        width: "95%", marginLeft: "2.5%" }} />
                    <Typography sx={{ fontSize: '1.2em', marginLeft: '10px', marginTop: '5px' }}>
                        Projects:
                    </Typography>
                    {projects.map((project) => (
                        <Box sx={{ flexDirection: 'row', display: 'flex', width: '100%' }}
                        key={project.id}>
                            <Button key={project.id} color="inherit"
                            sx={{ textTransform: 'none', flexGrow: 1, justifyContent: 'flex-start',
                                height: '40px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            onClick={() => setSelectedProject(project.id)}>
                                <LiveSyncTextfield task_id={project.id} fieldKey='title' textValue={project.title}
                                setTextValue={(title) => taskApi.updateTask(project.id, 'title', title)} 
                                numberOnly={false} />
                            </Button>
                            <Button onClick={() => deleteProject(project.id)}
                            sx={{ color: 'inherit', padding: 0, width: '40px', height: '40px' }}>
                                <DeleteIcon />
                            </Button>
                        </Box>
                    ))}
                    <Button onClick={() => taskApi.addTask(0, setProjects)}
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