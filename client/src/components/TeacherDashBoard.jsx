import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  ClipboardList, TrendingUp, CheckCircle, Plus, Trash2,
  Clock, MapPin, Loader2, AlertTriangle, Users, Menu
} from "lucide-react";
import { isValidSubject } from "../utils/subjectUtils";

const TeacherDashBoard = ({ isDark, setSidebarOpen }) => {
  const [classes, setClasses] = useState([]);
  // ... state ...

  // ... (rest of the component logic)

  const cardClass = isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const inputClass = isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-300 text-gray-900";

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Faculty Dashboard...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className={`lg:hidden p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 className={`text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent`}>Faculty Dashboard</h1>
          <p className={`mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Manage your classes and monitor student progress.</p>
        </div>
      </div>

      {/* Class Manager */}
      <div className={`p-6 rounded-2xl border ${cardClass}`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${textClass}`}>
          <Clock className="text-blue-500" /> Class Schedule
        </h2>

        <form onSubmit={handleAddClass} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
          <input type="text" placeholder="Subject" required className={`p-3 rounded-xl border ${inputClass}`} value={newClass.subject} onChange={e => setNewClass({ ...newClass, subject: e.target.value })} />
          <input type="text" placeholder="Time (e.g. 10:00 AM)" required className={`p-3 rounded-xl border ${inputClass}`} value={newClass.time} onChange={e => setNewClass({ ...newClass, time: e.target.value })} />
          <input type="text" placeholder="Room" required className={`p-3 rounded-xl border ${inputClass}`} value={newClass.room} onChange={e => setNewClass({ ...newClass, room: e.target.value })} />
          <select className={`p-3 rounded-xl border ${inputClass}`} value={newClass.day} onChange={e => setNewClass({ ...newClass, day: e.target.value })}>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button disabled={processing} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20">
            {processing ? <Loader2 className="animate-spin" /> : <Plus size={20} />} Add Class
          </button>
        </form>

        <div className="grid md:grid-cols-3 gap-4">
          {classes.map(cls => (
            <div key={cls.id} className={`p-5 rounded-xl border transition-all ${cls.isCancelled ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/30' : cardClass}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className={`font-bold text-lg ${textClass}`}>{cls.subject}</h3>
                  <p className="text-sm opacity-60 flex items-center gap-1 mt-1"><Clock size={14} /> {cls.day} • {cls.time}</p>
                  <p className="text-sm opacity-60 flex items-center gap-1"><MapPin size={14} /> Room {cls.room}</p>
                </div>
                <button onClick={() => deleteClass(cls.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
              </div>
              {cls.isCancelled && <div className="flex items-center gap-2 text-red-500 text-xs font-bold mb-3"><AlertTriangle size={14} /> CANCELLED</div>}
              <button onClick={() => toggleCancel(cls.id, cls.isCancelled)} className={`w-full py-2 rounded-lg font-bold text-sm border transition-colors ${cls.isCancelled ? 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100' : 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100'}`}>
                {cls.isCancelled ? "Restore Class" : "Cancel Class"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Assignments & Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${textClass}`}><ClipboardList className="text-purple-500" /> Assignments</h2>
          <div className="space-y-4">
            {assignments.map((a) => (
              <div key={a.id} className={`p-5 rounded-xl border ${cardClass}`}>
                <h3 className={`font-bold ${textClass}`}>{a.title}</h3>
                <p className="text-sm opacity-60 mb-2">{a.subject}</p>
                <div className="flex justify-between text-sm items-center">
                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono text-xs">{a.submissions}/{a.total} Submitted</span>
                  <CheckCircle size={16} className={a.submissions === a.total ? "text-green-500" : "text-gray-300"} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${textClass}`}><TrendingUp className="text-orange-500" /> AI Insights</h2>
          <div className="space-y-3">
            {gapInsights.map((gap) => (
              <div key={gap.id} className={`p-5 rounded-xl border ${cardClass}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`font-bold ${textClass}`}>{gap.topic}</h3>
                    <p className="text-sm opacity-60 flex items-center gap-1"><Users size={14} /> {gap.affectedStudents} students struggling</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${gap.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{gap.severity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashBoard;