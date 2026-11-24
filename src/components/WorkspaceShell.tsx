import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CalendarCheck,
  CheckSquare,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  Fingerprint,
  FolderOpen,
  GraduationCap,
  LineChart,
  MessageSquare,
  Moon,
  RotateCcw,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { triggerTextDownload } from '../utils/download';
import { CAMPUS_IMAGES } from '../data/campusData';
import type { CampusState, PersonaRole } from '../types';
import { StudentPortal, type StudentTab } from './StudentPortal';
import { FacultyPortal, type FacultyTab } from './FacultyPortal';
import { ParentPortal, type ParentTab } from './ParentPortal';
import { AdminPortal, type AdminTab } from './AdminPortal';

interface WorkspaceShellProps {
  role: PersonaRole;
  campusState: CampusState;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onChangeRole: (role: PersonaRole) => void;
  onBackToLanding: () => void;
  onResetDemoData: () => void;
  // Student handlers
  onSubmitAssignment: (id: string) => void;
  onToggleRsvp: (id: string) => void;
  // Faculty handlers
  onAddResource: (res: Omit<CampusState['resources'][0], 'id' | 'date'>) => void;
  onAddAssignment: (asg: Omit<CampusState['assignments'][0], 'id' | 'status'>) => void;
  onToggleSyllabusUnit: (courseCode: string, unitId: string) => void;
  onToggleStudentAttendance: (enrollmentNo: string) => void;
  onSaveAttendanceBatch: (allOverride?: 'Present' | 'Absent') => void;
  onUpdateStudentMarks: (enrollmentNo: string, field: 'internalMarks' | 'midTermMarks', value: number) => void;
  onGradeAssignment: (assignmentId: string, score: number) => void;
  onPublishAnnouncement: (title: string, detail: string) => void;
  onFacultyMessage: (recipient: string, subject: string, body: string, channel: 'faculty-parent' | 'faculty-student') => void;
  // Parent handlers
  onMarkAllAlertsRead: () => void;
  onMarkAlertRead: (alertId: string) => void;
  onSendParentMessage: (recipient: string, subject: string, body: string, channel: 'faculty-parent' | 'admin-parent') => void;
  // Admin handlers
  onSimulateBiometric: (log: Omit<CampusState['biometricLogs'][0], 'id' | 'timestamp'>) => void;
  onAddRoomBooking: (booking: Omit<CampusState['roomBookings'][0], 'id' | 'capacity' | 'status'>) => void;
  onIssueBook: (bookId: string, borrowerName: string, borrowerId: string) => void;
  onReturnBook: (bookId: string) => void;
  onPayFee: (feeId: string, method: string) => void;
  onSendFeeReminder: (feeId: string) => void;
}

const PERSONA_META: Record<
  PersonaRole,
  {
    label: string;
    shortLabel: string;
    name: string;
    detail: string;
    avatar?: string;
  }
> = {
  student: {
    label: 'Student Hub',
    shortLabel: 'Student',
    name: 'Omprakash',
    detail: 'B.Tech CSE-DS · Sem 5',
    avatar: CAMPUS_IMAGES.studentAvatar,
  },
  faculty: {
    label: 'Faculty Suite',
    shortLabel: 'Faculty',
    name: 'Dr. Arvind Kulkarni',
    detail: 'Professor · Dept. of CSE-DS',
    avatar: CAMPUS_IMAGES.facultyAvatar,
  },
  parent: {
    label: 'Parent Dashboard',
    shortLabel: 'Parent',
    name: 'Mrs. Meera Sharma',
    detail: 'Parent · Ward 04215602723',
    avatar: CAMPUS_IMAGES.parentAvatar,
  },
  admin: {
    label: 'Campus Operations',
    shortLabel: 'Campus Ops',
    name: 'Rajesh Verma',
    detail: 'Registrar & Operations Lead',
  },
};

export function WorkspaceShell(props: WorkspaceShellProps) {
  const {
    role,
    campusState,
    darkMode,
    onToggleDarkMode,
    onChangeRole,
    onBackToLanding,
    onResetDemoData,
  } = props;

  const [studentTab, setStudentTab] = useState<StudentTab>('academics');
  const [facultyTab, setFacultyTab] = useState<FacultyTab>('courses');
  const [parentTab, setParentTab] = useState<ParentTab>('alerts');
  const [adminTab, setAdminTab] = useState<AdminTab>('biometrics');
  const [avatarError, setAvatarError] = useState<Record<string, boolean>>({});
  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState(false);

  const persona = PERSONA_META[role];
  const unreadAlerts = campusState.alerts.filter((a) => !a.read);

  function handleExportPersonaSummary() {
    const lines = [
      `DELHI TECHNICAL CAMPUS, GREATER NOIDA — ${persona.label.toUpperCase()} SNAPSHOT`,
      `User: ${persona.name} (${persona.detail})`,
      `Exported: ${new Date().toLocaleString()}`,
      '--------------------------------------------------------------------',
      `Enrolled Courses: ${campusState.courses.length}`,
      `Pending Assignments: ${campusState.assignments.filter((a) => a.status === 'Pending').length}`,
      `Upcoming Campus Events: ${campusState.events.length}`,
      `Unread Advisories: ${unreadAlerts.length}`,
    ];
    triggerTextDownload(`DTC_${role}_summary.txt`, lines.join('\n'));
  }

  const navItems: Array<{ id: string; label: string; icon: React.ReactNode }> =
    role === 'student'
      ? [
          { id: 'academics', label: 'Academic Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'attendance', label: 'Attendance Tracker', icon: <CheckSquare className="w-4 h-4" /> },
          { id: 'materials', label: 'Course Materials', icon: <FolderOpen className="w-4 h-4" /> },
          { id: 'campus-life', label: 'Campus Life Directory', icon: <Calendar className="w-4 h-4" /> },
        ]
      : role === 'faculty'
      ? [
          { id: 'courses', label: 'Course Management', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'roster', label: 'Attendance & Grades', icon: <ClipboardList className="w-4 h-4" /> },
          { id: 'communication', label: 'Communication Hub', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'analytics', label: 'Performance Analytics', icon: <LineChart className="w-4 h-4" /> },
        ]
      : role === 'parent'
      ? [
          { id: 'alerts', label: 'Real-Time Alerts', icon: <Bell className="w-4 h-4" /> },
          { id: 'reports', label: 'Academic Reports', icon: <FileText className="w-4 h-4" /> },
          { id: 'gpa', label: 'GPA & CGPA Monitor', icon: <LineChart className="w-4 h-4" /> },
          { id: 'messaging', label: 'Secure Messaging', icon: <MessageSquare className="w-4 h-4" /> },
        ]
      : [
          { id: 'biometrics', label: 'Attendance System', icon: <Fingerprint className="w-4 h-4" /> },
          { id: 'rooms', label: 'Events & Rooms', icon: <CalendarCheck className="w-4 h-4" /> },
          { id: 'library', label: 'Library Management', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'fees', label: 'Fees & Payments', icon: <CreditCard className="w-4 h-4" /> },
        ];

  const activeTabId =
    role === 'student'
      ? studentTab
      : role === 'faculty'
      ? facultyTab
      : role === 'parent'
      ? parentTab
      : adminTab;

  function handleSelectTab(id: string) {
    if (role === 'student') setStudentTab(id as StudentTab);
    else if (role === 'faculty') setFacultyTab(id as FacultyTab);
    else if (role === 'parent') setParentTab(id as ParentTab);
    else setAdminTab(id as AdminTab);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Workspace Top Bar with Role Switcher & Dark Mode Toggle */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={onBackToLanding}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0F274A] dark:hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Campus Overview</span>
            </button>
            <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:inline-block" aria-hidden="true" />
            <div className="flex items-center gap-2 font-display font-bold text-sm lg:text-base text-[#0F274A] dark:text-white whitespace-nowrap truncate">
              <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
              <span>Delhi Technical Campus</span>
            </div>
          </div>

          {/* Top-Bar Role Switcher for the 4 User Personas */}
          <nav
            aria-label="Portal Role Switcher"
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto"
          >
            {(['student', 'faculty', 'parent', 'admin'] as PersonaRole[]).map((r) => {
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => onChangeRole(r)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#0F274A] dark:bg-amber-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-[#0F274A] dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700'
                  }`}
                >
                  {PERSONA_META[r].shortLabel}
                </button>
              );
            })}
          </nav>

          {/* Theme Switch, Alerts Drawer Button & Active Persona Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setAlertsDrawerOpen((o) => !o)}
              aria-label="Toggle campus alerts drawer"
              title="Campus Notifications"
              className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="hidden lg:flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{persona.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{persona.detail}</div>
              </div>
              {persona.avatar && !avatarError[role] ? (
                <img
                  src={persona.avatar}
                  alt={persona.name}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError((prev) => ({ ...prev, [role]: true }))}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#0F274A] dark:bg-slate-800 text-white flex items-center justify-center text-xs font-bold border border-slate-200 dark:border-slate-700">
                  <Users className="w-4 h-4 text-amber-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Workspace Body: Sidebar + Main Viewport */}
      <div className="max-w-[1440px] w-full mx-auto flex-1 flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between gap-4">
          <div>
            <div className="px-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">{persona.label}</div>
              <div className="text-sm font-display font-bold text-[#0F274A] dark:text-white mt-0.5">{persona.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{persona.detail}</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5">
              {navItems.map((item) => {
                const isActive = activeTabId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#0F274A] dark:bg-amber-600 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#0F274A] dark:hover:text-white'
                    }`}
                  >
                    <span className={isActive ? 'text-amber-400 dark:text-white' : 'text-slate-500 dark:text-slate-400'}>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden md:block pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed px-2">
              Delhi Technical Campus · Greater Noida · GGSIPU Affiliated
            </div>
            <button
              type="button"
              onClick={handleExportPersonaSummary}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0F274A] dark:text-amber-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Snapshot</span>
            </button>
            <button
              type="button"
              onClick={onResetDemoData}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#0F274A] dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Campus Data</span>
            </button>
          </div>
        </aside>

        {/* Main Content Viewport with smooth motion transition */}
        <main className="flex-1 p-5 lg:p-8 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${role}-${activeTabId}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {role === 'student' && (
                <StudentPortal
                  activeTab={studentTab}
                  onSelectTab={setStudentTab}
                  campusState={campusState}
                  onSubmitAssignment={props.onSubmitAssignment}
                  onToggleRsvp={props.onToggleRsvp}
                />
              )}

              {role === 'faculty' && (
                <FacultyPortal
                  activeTab={facultyTab}
                  campusState={campusState}
                  onAddResource={props.onAddResource}
                  onAddAssignment={props.onAddAssignment}
                  onToggleSyllabusUnit={props.onToggleSyllabusUnit}
                  onToggleStudentAttendance={props.onToggleStudentAttendance}
                  onSaveAttendanceBatch={props.onSaveAttendanceBatch}
                  onUpdateStudentMarks={props.onUpdateStudentMarks}
                  onGradeAssignment={props.onGradeAssignment}
                  onPublishAnnouncement={props.onPublishAnnouncement}
                  onSendMessage={props.onFacultyMessage}
                />
              )}

              {role === 'parent' && (
                <ParentPortal
                  activeTab={parentTab}
                  onSelectTab={setParentTab}
                  campusState={campusState}
                  onMarkAllAlertsRead={props.onMarkAllAlertsRead}
                  onMarkAlertRead={props.onMarkAlertRead}
                  onSendParentMessage={props.onSendParentMessage}
                />
              )}

              {role === 'admin' && (
                <AdminPortal
                  activeTab={adminTab}
                  campusState={campusState}
                  onSimulateBiometric={props.onSimulateBiometric}
                  onAddRoomBooking={props.onAddRoomBooking}
                  onIssueBook={props.onIssueBook}
                  onReturnBook={props.onReturnBook}
                  onPayFee={props.onPayFee}
                  onSendFeeReminder={props.onSendFeeReminder}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Live Alerts Quick Drawer */}
      {alertsDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex justify-end" role="dialog" aria-modal="true" aria-label="Campus Notifications Drawer">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col">
            <div className="px-5 py-4 bg-[#0F274A] text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-300">Live Campus Feed</div>
                <h3 className="text-sm font-display font-bold">Notifications &amp; Advisories ({unreadAlerts.length} Unread)</h3>
              </div>
              <button type="button" onClick={() => setAlertsDrawerOpen(false)} aria-label="Close notifications" className="text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {campusState.alerts.map((a) => (
                <div key={a.id} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-amber-700 dark:text-amber-400">{a.category}</span>
                    <span className="font-mono">{a.timestamp}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white mt-1">{a.title}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{a.detail}</p>
                  {!a.read && (
                    <button
                      type="button"
                      onClick={() => props.onMarkAlertRead(a.id)}
                      className="mt-2 px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded cursor-pointer"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={props.onMarkAllAlertsRead}
                className="px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
              >
                Mark All Read
              </button>
              <button
                type="button"
                onClick={() => setAlertsDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
