import React from 'react';

interface WeekProps {
    date: Date;
    setDate: React.Dispatch<React.SetStateAction<Date>>;
}

const WeekComponent: React.FC<WeekProps> = ({date, setDate}) => {
    return (
        <div>
        <h1>Week</h1>
        </div>
    );
};

export default WeekComponent;