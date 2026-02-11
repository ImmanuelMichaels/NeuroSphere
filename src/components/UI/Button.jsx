import React from 'react';
import clsx from 'clsx';

const Button = ({ children, variant = 'primary', className, icon: Icon, ...props }) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "btn-primary text-white shadow-md shadow-teal-500/20",
        secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm",
        ghost: "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900",
        danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
    };

    return (
        <button
            className={clsx(baseStyles, variants[variant], className)}
            {...props}
        >
            {Icon && <Icon className="w-4 h-4" />}
            {children}
        </button>
    );
};

export default Button;
