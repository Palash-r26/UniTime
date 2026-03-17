import React from 'react';
import { NavLink, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  User,
  LogOut,
  X,
  Sun,
  Moon,
  BookOpen,
  PanelLeft, // Added Icon
  Menu       // Added Icon
} from "lucide-react";

// IMPORT IMAGES HERE
import logoLight from '../assets/2.png'; // White background logo for Light Mode
import logoDark from '../assets/3.png';  // Dark background logo for Dark Mode

export default function Sidebar({ onLogout, isDark, setIsDark, sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `flex items-center ${!sidebarOpen ? 'lg:justify-center px-2' : 'px-4 gap-3'} py-3 rounded-lg font-medium transition-all duration-300 ${isActive
      ? "bg-blue-600 text-white"
      : isDark
        ? "text-gray-300 hover:bg-gray-700"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  // Updated logout handler to terminate real-time session
  const handleLogout = async () => {
    try {
      await signOut(auth); // Terminates Firebase session
      onLogout(); // Clears local state in App.jsx
      navigate("/"); // Redirects to login view
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 h-full overflow-y-auto border-r transition-all duration-300 transform p-4 shadow-lg
        lg:sticky lg:top-0 lg:h-screen lg:z-0
        ${sidebarOpen
          ? 'w-64 translate-x-0'
          : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'} 
        ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
        flex flex-col`}>

        {/* Header with close button */}
        <div className={`flex items-center ${!sidebarOpen ? 'lg:justify-center' : 'justify-between'} mb-8 transition-all duration-300`}>

          {/* LOGO - Hide when collapsed on desktop */}
          <div className={`flex items-center gap-2 ${!sidebarOpen ? 'lg:hidden' : ''}`}>
            <img
              src={isDark ? logoDark : logoLight}
              alt="UniTime Logo"
              className="h-10 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className={`p-2 rounded-lg lg:hidden transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
            >
              <X size={18} />
            </button>

            {/* Desktop Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              className={`hidden lg:block p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
            >
              {sidebarOpen ? <PanelLeft size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <NavLink to="/" className={linkClass} title={!sidebarOpen ? "Dashboard" : ""}>
            <LayoutDashboard size={20} /> <span className={!sidebarOpen ? 'lg:hidden' : ''}>Dashboard</span>
          </NavLink>

          <NavLink to="/analytics" className={linkClass} title={!sidebarOpen ? "Analytics" : ""}>
            <BarChart3 size={20} /> <span className={!sidebarOpen ? 'lg:hidden' : ''}>Analytics</span>
          </NavLink>

          <NavLink to="/timetable" className={linkClass} title={!sidebarOpen ? "Academic Documents" : ""}>
            <BookOpen size={20} /> <span className={!sidebarOpen ? 'lg:hidden' : ''}>Academic Documents</span>
          </NavLink>

          <NavLink to="/profile" className={linkClass} title={!sidebarOpen ? "Profile" : ""}>
            <User size={20} /> <span className={!sidebarOpen ? 'lg:hidden' : ''}>Profile</span>
          </NavLink>

          <NavLink to="/settings" className={linkClass} title={!sidebarOpen ? "Settings" : ""}>
            <Settings size={20} /> <span className={!sidebarOpen ? 'lg:hidden' : ''}>Settings</span>
          </NavLink>
        </nav>

        <button
          onClick={handleLogout}
          title={!sidebarOpen ? "Logout" : ""}
          className={`flex items-center ${!sidebarOpen ? 'lg:justify-center px-2' : 'px-4 gap-3'} py-3 rounded-lg font-medium transition-all duration-300 ${isDark
            ? 'text-red-400 hover:bg-gray-700'
            : 'text-red-600 hover:bg-red-50'
            }`}
        >
          <LogOut size={20} /> <span className={!sidebarOpen ? 'lg:hidden' : ''}>Logout</span>
        </button>
      </aside>
    </>
  );
}
