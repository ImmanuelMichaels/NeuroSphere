import React from 'react';
import clsx from 'clsx';

const Card = ({ children, className, hover = true, onClick }) => {
    return (
        <div
            className={clsx(
                "glass-panel p-6 transition-all duration-300 bg-white",
                hover && "hover:-translate-y-1 hover:shadow-lg",
                onClick && "cursor-pointer",
                className
            )}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default Card;
