
import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Settings, Users, ClipboardList, LogOut, Trash2, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Student, TARGET_GROUPS, GROUP_MAX_SIZE, ADMIN_PASSCODE } from './types';

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
      <span className="font-medium">{message}</span>
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
    <div className={`bg-white rounded-xl shadow-sm border ${isFull ? 'border-indigo-100' : 'border-gray-100'} overflow-hidden transition-all hover:shadow-md`}>
      <div className={`p-4 ${isFull ? 'bg-indigo-50' : 'bg-gray-50'} flex justify-between items-center border-b`}>
        <h3 className="font-bold text-gray-800 text-lg">Group {groupId}</h3>
        <span className={`text-sm font-semibold px-2 py-1 rounded ${isFull ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-200 text-gray-600'}`}>
          {members.length} / {GROUP_MAX_SIZE}
        </span>
      </div>
      <div className="p-4 min-h-[150px]">
        {members.length === 0 ? (
          <p className="text-gray-400 italic text-sm text-center py-8">No members yet</p>
        ) : (
          <ul className="space-y-2">
            {members.sort((a, b) => a.assignedAt - b.assignedAt).map((m) => (
              <li key={m.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100 group">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">{m.name}</span>
                  {m.studentId && <span className="text-[10px] text-gray-400 uppercase tracking-wider">ID: {m.studentId}</span>}
                </div>
                {isAdmin && onRemove && (
                  <button 
                    onClick={() => onRemove(m.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    title="Remove Student"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
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
      showToast("Please enter your full name", "error");
      return;
    }

    setIsProcessing(true);

    // Artificial delay for "processing" feel
    await new Promise(r => setTimeout(r, 600));

    // Check for duplicate
    const uniqueKey = studentId.trim() ? studentId.trim() : name.trim().toLowerCase();
    const existing = students.find(s => 
      (s.studentId && s.studentId === studentId.trim()) || 
      (s.name.toLowerCase() === name.trim().toLowerCase())
    );

    if (existing) {
      showToast(`${name}, you are already assigned to Group ${existing.groupId}`, "info");
      setIsProcessing(false);
      return;
    }

    // Logic for assignment
    const availableGroups = TARGET_GROUPS.filter(gId => 
      students.filter(s => s.groupId === gId).length < GROUP_MAX_SIZE
    );

    if (availableGroups.length === 0) {
      showToast("All groups are full.", "error");
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
    showToast(`Successfully assigned to Group ${randomGroup}!`, "success");
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
      showToast("Welcome, Admin", "success");
    } else {
      showToast("Incorrect passcode", "error");
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset ALL groups? This cannot be undone.")) {
      setStudents([]);
      showToast("All data cleared", "success");
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
      .map(s => [
        s.name, 
        s.studentId || "N/A", 
        `Group ${s.groupId}`, 
        new Date(s.assignedAt).toLocaleString()
      ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `group_assignment_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    showToast("Student removed", "info");
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Users size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 hidden sm:block">
              Group Generator
            </h1>
          </div>

          <div className="flex gap-2">
            {!isAdmin ? (
              <button 
                onClick={() => setShowAdminLogin(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
              >
                <Settings size={18} />
                <span>Admin</span>
              </button>
            ) : (
              <button 
                onClick={() => setIsAdmin(false)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span>Exit Admin</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* Intro Section */}
        <section className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Join a Group</h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Group 1 is already settled. Please enter your details below to be randomly assigned to Group 2, 3, 4, or 5.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs px-3 py-1.5 rounded-full">
            <AlertCircle size={14} />
            <span>5 slots available per group. First come, first served!</span>
          </div>
        </section>

        {/* Student Flow Card */}
        {!isAdmin && (
          <section className="max-w-md mx-auto mb-12">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-50">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Student ID / Index (Optional)</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="E.g. 2024001"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                    isProcessing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                  }`}
                >
                  {isProcessing ? (
                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <UserPlus size={20} />
                      <span>Assign Me to a Group</span>
                    </>
                  )}
                </button>
              </form>
              <p className="text-[11px] text-gray-400 text-center mt-4">
                Assignments are final. Refreshing the page will keep your group.
              </p>
            </div>
          </section>
        )}

        {/* Admin Tools Panel */}
        {isAdmin && (
          <section className="bg-white rounded-2xl border border-red-100 shadow-lg p-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-red-600 flex items-center gap-2 justify-center sm:justify-start">
                  <Settings size={20} /> Admin Dashboard
                </h2>
                <p className="text-sm text-gray-500">Manage group registrations and exports</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleExportCSV}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium border border-indigo-200"
                >
                  <Download size={18} /> Export CSV
                </button>
                <button 
                  onClick={handleReset}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-200"
                >
                  <Trash2 size={18} /> Reset All
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
              <p><strong>Note:</strong> Data is currently stored in <strong>LocalStorage</strong>. This works per device. For shared usage across multiple phones, a backend (Firebase/Supabase) would be required.</p>
            </div>
          </section>
        )}

        {/* Group Displays */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <ClipboardList className="text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-800">Current Assignments</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Total Summary */}
        <section className="mt-12 py-8 border-t border-gray-100 text-center">
          <div className="inline-flex items-center gap-6 text-gray-500 text-sm">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-indigo-600">{students.length}</span>
              <span>Total Students</span>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-indigo-600">{20 - students.length}</span>
              <span>Slots Remaining</span>
            </div>
          </div>
        </section>
      </main>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Admin Login</h3>
              <p className="text-gray-500 text-sm">Enter the passcode to access tools</p>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input
                type="password"
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Passcode"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-colors"
                >
                  Verify
                </button>
              </div>
            </form>
            <p className="text-[10px] text-gray-400 text-center mt-6">Hint: Try 1234</p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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
