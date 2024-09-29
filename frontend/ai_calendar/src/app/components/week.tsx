import React from 'react';

interface WeekProps {
    date: Date;
}

const WeekComponent: React.FC<WeekProps> = ({date}) => {
    return (
        <div>
        <h1>Week</h1>
        </div>
    );
};

export default WeekComponent;