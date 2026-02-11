import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, Repeat, Activity, Dna, Puzzle, Waves, FolderOpen, Smile, Tag } from 'lucide-react';
import clsx from 'clsx';
import './navbar.css';


const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { label: 'Telepsychiatry', path: '/', icon: Brain },
        { label: 'Bipolar', path: '/bipolar', icon: Activity },
        { label: 'Mood Tracker', path: '/mood-tracker', icon: Smile },
        { label: 'Therapy Notes', path: '/therapy-notes', icon: Tag },
        { label: 'Genetics', path: '/genetics', icon: Dna },
        { label: 'Autism', path: '/autism', icon: Puzzle },
        { label: 'Vitals', path: '/vitals', icon: Waves},
        { label: 'Medication Tracker', path: '/medications', icon: Repeat},
        { label: 'Meal planner', path: '/meals', icon: FolderOpen},
        { label: 'Stimming Tracker', path: '/stimtracker'},
        { label: 'Addiction Tracker', path: '/addiction' }
    ];

    return (
        <nav className="navbar">
            <div className="container-custom">
                <div className="logo-container">
                    <div className="logo-box">
                        <Brain />
                    </div>
                    <span className="logo-text">
                        Neuro<span className="accent">Sphere</span>
                    </span>
                
                    <div className="nav-actions">
                        <button 
                            onClick={() => navigate('/login')} 
                            className="btn-signin"
                        >
                            Sign In
                        </button>
                        
                        <button className="btn-primary">
                            Get Started
                        </button>
                    </div>
                </div>

                <ul className="nav-list">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={clsx("nav-link", isActive && "active")}
                                >
                                    {Icon && <Icon className="nav-icon" />}

                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
