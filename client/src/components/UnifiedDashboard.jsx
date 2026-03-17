import React, { useState, useEffect } from "react";
import {
  Clock, Sparkles, Brain, Loader2, BookOpen, Plus, TrendingUp, AlertTriangle, Users, Menu
} from "lucide-react";
import { db, auth } from "../firebase";
import SmartNotifications from "./SmartNotifications";
import FocusTimer from "./FocusTimer";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from "firebase/firestore";

const UnifiedDashboard = ({ isDark, setSidebarOpen }) => {
  // --- THEME CONSTANTS ---
  const theme = isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const card = isDark ? "bg-gray-800 border-gray-700 shadow-xl" : "bg-white border-gray-200 shadow-sm";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const inputTheme = isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900";

  // --- STATE ---
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [newScore, setNewScore] = useState({ subject: "", topic: "", score: "", maxScore: "" });
  const [metrics, setMetrics] = useState({ avgScore: 0, testCount: 0 });
  const [freeTimeSlots, setFreeTimeSlots] = useState([]);
  const [planningId, setPlanningId] = useState(null);
  const [aiPlans, setAiPlans] = useState({});
  const [focusSubject, setFocusSubject] = useState("");
  const [focusClass, setFocusClass] = useState(null);

  // --- EFFECTS ---
  useEffect(() => {
    if (!auth.currentUser) return;

    // 1. Fetch Timetable
    const q = query(collection(db, "timetable"), where("userId", "==", auth.currentUser.uid));
    const unsubscribeTimetable = onSnapshot(q, (snapshot) => {
      const classes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUpcomingClasses(classes);
      setFreeTimeSlots(classes.filter(c => c.isCancelled));
      setLoading(false);
    }, (error) => {
      console.error("Timetable subscription error:", error);
      setLoading(false);
    });

    // 2. Fetch Quiz Scores for Metrics
    const scoreQ = query(collection(db, "quiz_scores"), where("userId", "==", auth.currentUser.uid));
    const unsubscribeScores = onSnapshot(scoreQ, (snapshot) => {
      const scores = snapshot.docs.map(doc => doc.data());
      if (scores.length > 0) {
        const total = scores.reduce((acc, curr) => acc + (parseFloat(curr.score) / parseFloat(curr.maxScore) * 100), 0);
        setMetrics({
          avgScore: Math.round(total / scores.length),
          testCount: scores.length
        });
      }
    });

    return () => {
      unsubscribeTimetable();
      unsubscribeScores();
    };
  }, []);

  // --- HANDLERS ---
  const handleAddScore = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, "quiz_scores"), {
        ...newScore,
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp()
      });
      setShowScoreModal(false);
      setNewScore({ subject: "", topic: "", score: "", maxScore: "" });
    } catch (error) {
      console.error("Error adding score:", error);
    }
  };

  const handleGapClose = async (cls) => {
    try {
      await updateDoc(doc(db, "timetable", cls.id), { isCancelled: false });
    } catch (error) {
      console.error("Error restoring class:", error);
    }
  };

  const handlePlanFreeTime = (cls) => {
    setPlanningId(cls.id);
    // Simple mock logic for AI planning
    setTimeout(() => {
      setAiPlans(prev => ({
        ...prev,
        [cls.id]: `Revise ${cls.subject} previous year questions or complete the pending assignment.`
      }));
      setPlanningId(null);
    }, 1500);
  };

  return (
    <div className={`min-h-screen p-3 md:p-6 ${theme}`}>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <header className={`pb-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${textPrimary}`}>Student Dashboard</h1>
              <p className={`${textSecondary}`}>Manage your academics intelligently.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowScoreModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} /> Add Score
            </button>
            <SmartNotifications isDark={isDark} />
          </div>
        </header>

        {/* --- ADD SCORE MODAL --- */}
        {showScoreModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`w-full max-w-md p-6 rounded-xl shadow-2xl ${card}`}>
              <h3 className={`text-lg font-bold mb-4 ${textPrimary}`}>Record Quiz/Test Score</h3>
              <form onSubmit={handleAddScore} className="space-y-4">
                <div>
                  <label className={`block text-sm mb-1 ${textSecondary}`}>Subject</label>
                  <input
                    className={`w-full px-3 py-2 rounded-lg border ${inputTheme}`}
                    value={newScore.subject}
                    onChange={e => setNewScore({ ...newScore, subject: e.target.value })}
                    placeholder="e.g. Mathematics"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${textSecondary}`}>Topic (Optional)</label>
                  <input
                    className={`w-full px-3 py-2 rounded-lg border ${inputTheme}`}
                    value={newScore.topic}
                    onChange={e => setNewScore({ ...newScore, topic: e.target.value })}
                    placeholder="e.g. Calculus"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm mb-1 ${textSecondary}`}>Score</label>
                    <input
                      type="number"
                      className={`w-full px-3 py-2 rounded-lg border ${inputTheme}`}
                      value={newScore.score}
                      onChange={e => setNewScore({ ...newScore, score: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${textSecondary}`}>Max Score</label>
                    <input
                      type="number"
                      className={`w-full px-3 py-2 rounded-lg border ${inputTheme}`}
                      value={newScore.maxScore}
                      onChange={e => setNewScore({ ...newScore, maxScore: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowScoreModal(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${textSecondary}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                  >
                    Save Score
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- METRICS & KPI --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Learning Gaps Removed */}

          <div className={`p-5 rounded-xl border shadow-sm transition-all hover:shadow-md ${card}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <span className={`text-sm font-medium ${textSecondary}`}>Avg Quiz Score</span>
            </div>
            <p className={`text-2xl font-bold ${metrics.avgScore >= 75 ? 'text-green-500' : 'text-yellow-500'}`}>
              {metrics.avgScore}%
            </p>
          </div>

          <div className={`p-5 rounded-xl border shadow-sm transition-all hover:shadow-md ${card}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                <Clock size={20} />
              </div>
              <span className={`text-sm font-medium ${textSecondary}`}>Free Time Found</span>
            </div>
            <p className={`text-2xl font-bold ${textPrimary}`}>
              {freeTimeSlots.length} <span className="text-sm font-normal opacity-60">slots today</span>
            </p>
          </div>
        </div>



        {/* --- SCHEDULE LIST --- */}
        <div className="space-y-8">

          {/* 1. ONGOING / CANCELLED CLASSES SECTION */}
          {upcomingClasses.some(c => c.isCancelled) && (
            <div className="opacity-90">
              <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${textPrimary}`}>
                <Clock className="text-blue-500" /> Ongoing Classes
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingClasses.filter(c => c.isCancelled).map((cls) => (
                  <div key={cls.id} className={`p-5 rounded-xl border border-dashed relative overflow-hidden transition-all ${isDark ? 'bg-red-900/10 border-red-800/30' : 'bg-red-50 border-red-200'}`}>

                    {/* Cancelled Badge Watermark */}
                    <div className="absolute top-2 right-2 opacity-10 rotate-12 pointer-events-none">
                      <span className={`text-4xl font-bold uppercase ${isDark ? 'text-red-500' : 'text-red-600'}`}>Cancelled</span>
                    </div>

                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <div>
                        <h3 className={`font-bold text-lg mb-1 line-through opacity-70 ${textPrimary}`}>{cls.subject}</h3>
                        <div className={`flex items-center gap-2 text-sm opacity-70 ${textSecondary}`}>
                          <Clock size={14} />
                          <span>{cls.time}</span>
                          <span>•</span>
                          <span>{cls.day}</span>
                        </div>
                        <span className={`inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded ${isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'}`}>
                          CANCELLED
                        </span>
                      </div>
                    </div>

                    {/* Plan Now Action for Cancelled Classes */}
                    <div className={`mt-4 p-3 rounded-lg border backdrop-blur-sm ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-white/60 border-gray-100'}`}>
                      {aiPlans[cls.id] ? (
                        <div className="animate-in fade-in">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            <span className={`text-sm font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>AI Utilized Plan:</span>
                          </div>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{aiPlans[cls.id]}</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Brain className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                            <div className="text-sm">
                              <span className={`font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Free Time Found!</span>
                              <p className={`text-xs mt-0.5 ${textSecondary}`}>Use this {cls.time} slot wisely?</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleGapClose(cls)}
                              className={`p-2 rounded-lg border transition-all ${isDark ? 'border-red-800 bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'border-red-100 bg-white text-red-500 hover:bg-red-50'}`}
                              title="Close Gap (Delete Cancellation)"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                            </button>
                            <button
                              onClick={() => handlePlanFreeTime(cls)}
                              disabled={planningId === cls.id}
                              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                            >
                              {planningId === cls.id ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                              Plan Now
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}



          {/* 1. MY COURSES / SUBJECT WISE SCHEDULE */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${textPrimary}`}>My Courses</h2>
            </div>

            {loading ? (
              <div className={`p-12 rounded-xl border border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'} flex flex-col items-center justify-center text-center`}>
                <Loader2 className={`w-8 h-8 mb-4 animate-spin ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <p className={textSecondary}>Loading course details...</p>
              </div>
            ) : upcomingClasses.length === 0 ? (
              <div className={`p-12 rounded-xl border border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'} text-center ${textSecondary}`}>
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No enrolled courses found.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {(() => {
                  // GROUPING LOGIC
                  const courses = {};

                  // SMART MAP: Name Keywords -> Code
                  const SUBJECT_MAP = [
                    { keywords: ["data science lab", "science lab"], code: "29242206" }, // Lab first specific
                    { keywords: ["algorithms lab", "algo lab"], code: "29242207" },
                    { keywords: ["data science", "data sci"], code: "29242201" },
                    { keywords: ["design and analysis", "algorithms", "daa", "dsa"], code: "29242202" },
                    { keywords: ["theory of computation", "toc"], code: "29242203" },
                    { keywords: ["communication", "networks", "cn"], code: "29242204" },
                    { keywords: ["design pattern", "patterns"], code: "29242205" },
                    { keywords: ["competitive programming", "cp"], code: "29242208" },
                    { keywords: ["proficiency"], code: "29242209" },
                    { keywords: ["macro project", "project-ii"], code: "29242210" },
                    { keywords: ["project management", "economics"], code: "29242211" },
                    { keywords: ["mandatory workshop", "intellectual"], code: "29242212" },
                    { keywords: ["novel engaging", "nec"], code: "NECXXXXX" },
                    { keywords: ["internship", "sip"], code: "SIP2XXXX" }
                  ];

                  const VALID_CODES = [
                    "29242201", "29242202", "29242203", "29242204", "29242205",
                    "29242206", "29242207", "29242208", "29242209", "29242210",
                    "29242211", "29242212", "NECXXXXX", "SIP2XXXX"
                  ];

                  upcomingClasses.forEach(cls => {
                    if (cls.isCancelled) return;

                    // 1. Normalize
                    const cleanSubject = cls.subject ? cls.subject.trim() : "Unknown Course";
                    const lowerSub = cleanSubject.toLowerCase();

                    // 2. Smart Extraction
                    let subjectCode = null;

                    // A: Is code already in string?
                    const codeMatch = cleanSubject.match(/(\d{8}|NECXXXXX|SIP2XXXX)/);
                    if (codeMatch) {
                      subjectCode = codeMatch[0];
                    } else {
                      // B: Map by Name
                      const match = SUBJECT_MAP.find(m => m.keywords.some(k => lowerSub.includes(k)));
                      if (match) subjectCode = match.code;
                    }

                    // 3. STRICT FILTER
                    if (!subjectCode || !VALID_CODES.includes(subjectCode)) {
                      return; // Skip if not valid
                    }

                    // 3. Generate Unique Key
                    // If code exists, that IS the key. 
                    // If not, use the full trimmed name to avoid merging unrelated non-coded subjects.
                    const key = subjectCode ? subjectCode : cleanSubject;

                    if (!courses[key]) {
                      courses[key] = {
                        code: subjectCode || '',
                        // If code exists, strip it from name for cleaner display
                        name: subjectCode ? cleanSubject.replace(subjectCode, '').replace(/^[ -]+|[ -]+$/g, '').trim() : cleanSubject,
                        faculty: cls.teacherName || 'Self Schedule',
                        type: cleanSubject.toLowerCase().includes('lab') ? 'LAB' : 'THEORY',
                        schedule: [],
                        totalClasses: 0
                      };
                    }

                    // 4. Add Slot to Schedule
                    // Prevent duplicate slots if data has duplicates (same day/time)
                    const alreadyExists = courses[key].schedule.some(s => s.day === cls.day && s.time === cls.time);
                    if (!alreadyExists) {
                      courses[key].schedule.push({ day: cls.day, time: cls.time, room: cls.room });
                      courses[key].totalClasses++;
                    }
                  });

                  return Object.values(courses).map((course, idx) => (
                    <div key={idx} className={`rounded-xl overflow-hidden border shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 ${card}`}>

                      {/* CARD HEADER */}
                      <div className="p-4 flex justify-between items-start border-b border-gray-100 dark:border-gray-700">
                        <div>
                          <h3 className={`font-bold text-xl ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{course.code}</h3>
                          <p className={`font-semibold text-sm line-clamp-2 h-10 ${textPrimary}`}>{course.name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${course.type === 'LAB'
                          ? isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700'
                          : isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'
                          }`}>
                          {course.type}
                        </span>
                      </div>

                      {/* PROGRESS BAR (Mock Attendance/Progress) */}
                      <div className="px-4 py-3">
                        <div className="flex justify-between text-xs mb-1.5 opacity-80">
                          <span className={textSecondary}>Weekly Load</span>
                          <span className={`font-bold ${textPrimary}`}>{course.totalClasses} Sessions</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <div className={`h-1.5 rounded-full ${isDark ? 'bg-indigo-500' : 'bg-indigo-600'}`} style={{ width: '100%' }}></div>
                        </div>
                      </div>

                      {/* SCHEDULE LIST */}
                      <div className={`px-4 py-3 border-t border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'} bg-opacity-50 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50/50'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${textSecondary}`}>Weekly Schedule</p>
                        <ul className="space-y-2">
                          {course.schedule.map((slot, i) => (
                            <li key={i} className="flex justify-between items-center text-sm">
                              <span className={`font-medium ${textPrimary}`}>{slot.day}</span>
                              <span className={`font-mono text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{slot.time}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Footer Removed */}
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>





        </div>

        {/* SMART FREE TIME DETECTION */}
        {freeTimeSlots.length > 0 && (
          <div className={`p-6 rounded-xl border ${card}`}>
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-indigo-500" />
              <h2 className={`text-lg font-bold ${textPrimary}`}>Smart Free-Time Detection</h2>
            </div>
            <div className="space-y-3">
              {freeTimeSlots.slice(0, 3).map((slot, idx) => {
                // Determine display values based on whether it's a raw class or smart slot
                const location = slot.room || (slot.context ? slot.context.location : 'Campus');
                const timeStr = slot.time || (slot.startTime ? `${slot.startTime} - ${slot.endTime}` : 'N/A');
                const duration = "60"; // Default to 60 for cancelled class
                const workload = "Medium";

                return (
                  <div key={idx} className={`p-4 rounded-lg border ${isDark ? 'bg-indigo-900/20 border-indigo-700' : 'bg-indigo-50 border-indigo-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className={`font-semibold ${textPrimary}`}>
                          {duration} min free • {timeStr}
                        </p>
                        <p className={`text-sm mt-1 ${textSecondary}`}>
                          📍 {location} • 📚 Workload: {workload}
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {slot.subject} (Cancelled)
                        </p>
                      </div>
                      <span className={`ml-3 text-xs px-2 py-1 rounded whitespace-nowrap ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
                        Cancelled
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}




        {/* --- FOCUS TIMER --- */}
        <div id="focus-timer-section" className="mt-8 p-1 rounded-xl" style={{
          background: 'linear-gradient(to right, #4f46e5, #9333ea)',
          padding: '2px'
        }}>
          <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <FocusTimer isDark={isDark} preSelectedSubject={focusSubject} preSelectedClass={focusClass} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default UnifiedDashboard;