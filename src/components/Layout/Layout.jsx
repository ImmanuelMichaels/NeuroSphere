import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden">
            <Navbar />
            <main className="container-custom py-8 fade-in">
                {children}
            </main>
        </div>
    );
};

export default Layout;
