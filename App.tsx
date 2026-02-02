
import React, { useState, useEffect } from 'react';
import { UserPlus, Settings, Users, ClipboardList, LogOut, Trash2, Download, AlertCircle, CheckCircle2, ExternalLink, X } from 'lucide-react';
import { Student, TARGET_GROUPS, GROUP_MAX_SIZE, ADMIN_PASSCODE, WHATSAPP_LINKS } from './types';

// Helper Components
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
  
  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 ${bgColor} text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-50 animate-bounce`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : type === 'error' ? <AlertCircle size={18} /> : <Users size={18} />}
      <span className="font-medium text-sm sm:text-base">{message}</span>
    </div>
  );
};

const GroupCard: React.FC<{ 
  groupId: number; 
  members: Student[]; 
  onRemove?: (id: string) => void;
  isAdmin?: boolean;
}> = ({ groupId, members, onRemove, isAdmin }) => {
  const isFull = members.length >= GROUP_MAX_SIZE;
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border ${isFull ? 'border-orange-100' : 'border-gray-100'} overflow-hidden transition-all hover:shadow-md h-full flex flex-col`}>
      <div className={`p-4 ${isFull ? 'bg-orange-50' : 'bg-gray-50'} flex justify-between items-center border-b`}>
        <h3 className="font-bold text-gray-800 text-lg">Group {groupId}</h3>
        <span className={`text-xs font-bold px-2 py-1 rounded ${isFull ? 'bg-orange-200 text-orange-800' : 'bg-gray-200 text-gray-600'}`}>
          {members.length} / {GROUP_MAX_SIZE}
        </span>
      </div>
      <div className="p-4 flex-grow">
        {members.length === 0 ? (
          <p className="text-gray-400 italic text-xs text-center py-8">Waiting for students...</p>
        ) : (
          <ul className="space-y-1.5">
            {members.sort((a, b) => a.assignedAt - b.assignedAt).map((m) => (
              <li key={m.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100 group">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-gray-700 truncate">{m.name}</span>
                  {m.studentId && <span className="text-[9px] text-gray-400 uppercase tracking-wider">ID: {m.studentId}</span>}
                </div>
                {isAdmin && onRemove && (
                  <button 
                    onClick={() => onRemove(m.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                    title="Remove Student"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-3 bg-gray-50/50 border-t text-center">
        <a 
          href={WHATSAPP_LINKS[groupId]} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-green-600 hover:text-green-700 flex items-center justify-center gap-1"
        >
          <ExternalLink size={10} /> Group WhatsApp
        </a>
      </div>
    </div>
  );
};

const SuccessModal: React.FC<{ groupId: number; name: string; onClose: () => void }> = ({ groupId, name, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-90 duration-300 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        
        <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">You're In!</h2>
        <p className="text-gray-600 mb-6">
          Hi <span className="font-bold text-indigo-600">{name}</span>, you have been assigned to <span className="font-bold text-indigo-600">Group {groupId}</span>.
        </p>
        
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-8">
          <p className="text-xs text-indigo-700 font-medium mb-3 uppercase tracking-widest">Next Step:</p>
          <a 
            href={WHATSAPP_LINKS[groupId]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all transform active:scale-95"
          >
            Join WhatsApp Group
            <ExternalLink size={18} />
          </a>
        </div>
        
        <button 
          onClick={onClose}
          className="text-gray-400 text-sm font-medium hover:text-gray-600"
        >
          Close and view list
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successAssignment, setSuccessAssignment] = useState<{ groupId: number; name: string } | null>(null);

  const MAX_TOTAL_STUDENTS = 50;

  // Load data on mount
  useEffect(() => {
    const saved = localStorage.getItem('group_generator_students');
    if (saved) {
      try {
        setStudents(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse stored students", e);
      }
    }
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem('group_generator_students', JSON.stringify(students));
  }, [students]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    if (!name.trim()) {
      showToast("Full name is required", "error");
      return;
    }

    if (students.length >= MAX_TOTAL_STUDENTS) {
      showToast("Registration is closed. All 50 spots are taken.", "error");
      return;
    }

    setIsProcessing(true);

    // Simulated delay
    await new Promise(r => setTimeout(r, 800));

    const uniqueKey = studentId.trim() ? studentId.trim() : name.trim().toLowerCase();
    const existing = students.find(s => 
      (s.studentId && s.studentId === studentId.trim()) || 
      (s.name.toLowerCase() === name.trim().toLowerCase())
    );

    if (existing) {
      setSuccessAssignment({ groupId: existing.groupId, name: existing.name });
      setIsProcessing(false);
      return;
    }

    const availableGroups = TARGET_GROUPS.filter(gId => 
      students.filter(s => s.groupId === gId).length < GROUP_MAX_SIZE
    );

    if (availableGroups.length === 0) {
      showToast("All groups are currently full.", "error");
      setIsProcessing(false);
      return;
    }

    const randomGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];
    
    const newStudent: Student = {
      id: uniqueKey,
      name: name.trim(),
      studentId: studentId.trim() || undefined,
      groupId: randomGroup,
      assignedAt: Date.now()
    };

    setStudents(prev => [...prev, newStudent]);
    setSuccessAssignment({ groupId: randomGroup, name: name.trim() });
    setName('');
    setStudentId('');
    setIsProcessing(false);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setPasscode('');
      showToast("Admin access granted", "success");
    } else {
      showToast("Invalid passcode", "error");
    }
  };

  const handleReset = () => {
    if (confirm("Reset ALL data? This will clear all 50 spots.")) {
      setStudents([]);
      showToast("System Reset Successful", "success");
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      showToast("No data to export", "error");
      return;
    }
    const headers = ["Name", "Student ID", "Group", "Assigned At"];
    const rows = students
      .sort((a, b) => a.groupId - b.groupId || a.assignedAt - b.assignedAt)
      .map(s => [s.name, s.studentId || "N/A", `Group ${s.groupId}`, new Date(s.assignedAt).toLocaleString()]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `group_registrations_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const removeStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    showToast("Student removed", "info");
  };

  return (
    <div className="min-h-screen pb-20 bg-[#f9fafb]">
      {/* Navbar */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
              <Users size={22} />
            </div>
            <h1 className="text-lg font-black tracking-tight text-gray-900">STUDY <span className="text-indigo-600">SYNC</span></h1>
          </div>
          <button 
            onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isAdmin ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {isAdmin ? <LogOut size={18} /> : <Settings size={18} />}
            <span className="hidden sm:inline">{isAdmin ? 'Logout' : 'Admin'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        
        {/* Banner */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Group <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Assignment</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base sm:text-lg">
            Registration is open for Groups 2 to 5. Once assigned, join your group's WhatsApp to start collaborating!
          </p>
          <div className="mt-6 inline-flex flex-wrap justify-center gap-3">
            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100 uppercase tracking-widest">
              Total Capacity: 50
            </span>
            <span className="px-4 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 uppercase tracking-widest">
              Groups 2, 3, 4, 5 Only
            </span>
          </div>
        </div>

        {/* Student Form */}
        {!isAdmin && (
          <section className="max-w-xl mx-auto mb-16 relative">
            <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 relative z-10">
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. John Doe"
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all text-gray-800 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Student ID (Recommended)</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter your ID number"
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all text-gray-800 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full py-5 px-8 rounded-2xl font-black text-lg text-white shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 ${
                    isProcessing ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                  }`}
                >
                  {isProcessing ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <UserPlus size={22} />
                      <span>Assign My Group</span>
                    </>
                  )}
                </button>
              </form>
            </div>
            {/* Background decorative elements */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -z-0"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-50 rounded-full blur-3xl -z-0"></div>
          </section>
        )}

        {/* Admin Dashboard */}
        {isAdmin && (
          <section className="bg-white rounded-[2rem] border border-gray-200 shadow-xl p-8 mb-16 animate-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Admin Control</h2>
                <p className="text-gray-500 text-sm">Managing {students.length} of 50 students</p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={handleExportCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all font-bold">
                  <Download size={20} /> Export CSV
                </button>
                <button onClick={handleReset} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold shadow-lg shadow-red-100">
                  <Trash2 size={20} /> Reset All
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Groups Grid */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <ClipboardList className="text-indigo-600" size={24} />
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Group Progress</h2>
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Groups 2–5
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {TARGET_GROUPS.map((gId) => (
              <GroupCard
                key={gId}
                groupId={gId}
                members={students.filter(s => s.groupId === gId)}
                isAdmin={isAdmin}
                onRemove={isAdmin ? removeStudent : undefined}
              />
            ))}
          </div>
        </section>

        {/* Footer Summary */}
        <section className="mt-20 py-10 border-t border-gray-100">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-black text-indigo-600">{students.length}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Signed Up</div>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-3xl font-black text-gray-300">{MAX_TOTAL_STUDENTS - students.length}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Spots Left</div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">© 2025 Study Sync • Built for Student Collaboration</p>
          </div>
        </section>
      </main>

      {/* Modals */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Settings size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-900">Admin Login</h3>
              <p className="text-gray-500 text-sm">Enter the secure passcode</p>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input
                type="password"
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••"
                className="w-full px-4 py-4 rounded-2xl border-2 border-gray-100 text-center text-2xl tracking-[1em] focus:outline-none focus:border-indigo-500 transition-all"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100">Verify</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {successAssignment && (
        <SuccessModal 
          groupId={successAssignment.groupId} 
          name={successAssignment.name} 
          onClose={() => setSuccessAssignment(null)} 
        />
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default App;
