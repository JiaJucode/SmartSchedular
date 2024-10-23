import { Task } from '../tasks/page';

const server_base_url = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

const defaultNewTask = {
    id: 0,
    title: 'new task',
    description: '',
    startDate: null,
    endDate: null,
    priority: 0,
    estimatedTime: null,
    hoursToSchedule: null,
    completed: false,
};

export const addTask = 
(parentId: number, setTasks: React.Dispatch<React.SetStateAction<Task[]>>, taskDetails: Task=defaultNewTask) => {
    fetch(`${server_base_url}/task/add_task`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...taskDetails,
            parentId: parentId,
        })
    }
    ).then((response) => response.json())
    .then((data: {id: number}) => {
        setTasks((prevTasks) => {
            return [...prevTasks, {
                ...taskDetails,
                id: data.id,
            }];
        });
    });
}

export const fetchTasks = 
(parentId: number, setTasks: React.Dispatch<React.SetStateAction<Task[]>>) => {
    fetch(`${server_base_url}/task/get_tasks?parentId=${parentId}`)
    .then((response) => response.json())
    .then((data: {tasks: {id: number, title: string, description: string,
        start_datetime: string, end_datetime: string, priority: number,
        estimated_time: number, hours_to_schedule: number, completed: boolean}[]}) => {
        setTasks(data.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            startDate: task.start_datetime === "" || !task.start_datetime 
                ? null : new Date(task.start_datetime),
            endDate: task.end_datetime === "" || !task.end_datetime
                ? null : new Date(task.end_datetime),
            priority: task.priority,
            estimatedTime: task.estimated_time,
            hoursToSchedule: task.hours_to_schedule,
            completed: task.completed,
        })));
    });
}

export const updateTask = (task_id: number, updateKey: string, updateValue: any) => {
    fetch(`${server_base_url}/task/update_task`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: task_id,
            [updateKey]: updateValue instanceof Date ? updateValue.toISOString() : updateValue,
        }),
    });
}

export const deleteTask = (task_id: number, 
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>) => {
    fetch(`${server_base_url}/task/delete_task`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: task_id,
        }),
    }).then(() => {
        setTasks((prevTasks) => {
            return prevTasks.filter((task) => task.id !== task_id);
        });
    });
}

export const scheduleTask = async (task_id: number) => {
    const response = await fetch(`${server_base_url}/task/schedule_task`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: task_id,
        }),
    });
    const data = await response.json();
    return data.timeLeft
}

export const descheduleTask = (task_id: number) => {
    fetch(`${server_base_url}/task/deschedule_task`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: task_id,
        }),
    });
}
