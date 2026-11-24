import React, { useMemo, useState } from 'react';
import { Check, CheckCircle2, Download, FilePlus2, Megaphone, Reply, Search, Send, Users, X } from 'lucide-react';
import { HorizontalBarChart, VerticalBarChart } from './Charts';
import type { AssignmentItem, CampusState, StudyResource } from '../types';
import { triggerTextDownload } from '../utils/download';

export type FacultyTab = 'courses' | 'roster' | 'communication' | 'analytics';

interface FacultyPortalProps {
  activeTab: FacultyTab;
  campusState: CampusState;
  onAddResource: (resource: Omit<StudyResource, 'id' | 'date'>) => void;
  onAddAssignment: (assignment: Omit<AssignmentItem, 'id' | 'status'>) => void;
  onToggleSyllabusUnit: (courseCode: string, unitId: string) => void;
  onToggleStudentAttendance: (enrollmentNo: string) => void;
  onSaveAttendanceBatch: (allOverride?: 'Present' | 'Absent') => void;
  onUpdateStudentMarks: (enrollmentNo: string, field: 'internalMarks' | 'midTermMarks', value: number) => void;
  onGradeAssignment: (assignmentId: string, score: number) => void;
  onPublishAnnouncement: (title: string, detail: string) => void;
  onSendMessage: (recipient: string, subject: string, body: string, channel: 'faculty-parent' | 'faculty-student') => void;
}

export function FacultyPortal({
  activeTab,
  campusState,
  onAddResource,
  onAddAssignment,
  onToggleSyllabusUnit,
  onToggleStudentAttendance,
  onSaveAttendanceBatch,
  onUpdateStudentMarks,
  onGradeAssignment,
  onPublishAnnouncement,
  onSendMessage,
}: FacultyPortalProps) {
  const [selectedCourseCode, setSelectedCourseCode] = useState('ETDS-305');

  // Upload resource state
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState<StudyResource['type']>('Lecture Notes');
  const [resSummary, setResSummary] = useState('');
  const [resSuccess, setResSuccess] = useState('');

  // Create & grade assignment state
  const [asgTitle, setAsgTitle] = useState('');
  const [asgDue, setAsgDue] = useState('04 Dec 2026');
  const [asgMarks, setAsgMarks] = useState(10);
  const [gradingAsg, setGradingAsg] = useState<AssignmentItem | null>(null);
  const [gradeValue, setGradeValue] = useState<number>(9);

  // Roster filter & feedback
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterSavedMsg, setRosterSavedMsg] = useState('');

  // Communication state
  const [annTitle, setAnnTitle] = useState('');
  const [annDetail, setAnnDetail] = useState('');
  const [annSent, setAnnSent] = useState('');
  const [msgRecipient, setMsgRecipient] = useState('Mrs. Meera Sharma');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');

  // Analytics view mode
  const [analyticsMetric, setAnalyticsMetric] = useState<'marks' | 'attendance'>('marks');

  const activeCourse =
    campusState.courses.find((c) => c.code === selectedCourseCode) || campusState.courses[0];

  const filteredRoster = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    if (!q) return campusState.roster;
    return campusState.roster.filter(
      (s) => s.name.toLowerCase().includes(q) || s.enrollmentNo.toLowerCase().includes(q)
    );
  }, [campusState.roster, rosterSearch]);

  const gradeDistribution = useMemo(() => {
    const buckets: Record<string, number> = { O: 0, 'A+': 0, A: 0, 'B+': 0, B: 0 };
    campusState.roster.forEach((s) => {
      const total = s.internalMarks + s.midTermMarks;
      if (total >= 45) buckets['O'] += 1;
      else if (total >= 41) buckets['A+'] += 1;
      else if (total >= 37) buckets['A'] += 1;
      else if (total >= 33) buckets['B+'] += 1;
      else buckets['B'] += 1;
    });
    return Object.entries(buckets).map(([label, value]) => ({ label, value }));
  }, [campusState.roster]);

  function handleResourceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resTitle.trim()) return;
    onAddResource({
      courseCode: activeCourse.code,
      title: resTitle.trim(),
      type: resType,
      uploadedBy: 'Dr. Arvind Kulkarni',
      size: '1.4 MB',
      summary: resSummary.trim() || `Uploaded for ${activeCourse.title} (${activeCourse.code}).`,
    });
    setResTitle('');
    setResSummary('');
    setResSuccess('Material published and synced to Student Course Materials.');
    setTimeout(() => setResSuccess(''), 3000);
  }

  function handleAssignmentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!asgTitle.trim()) return;
    onAddAssignment({
      courseCode: activeCourse.code,
      title: asgTitle.trim(),
      dueDate: asgDue,
      maxMarks: asgMarks,
    });
    setAsgTitle('');
  }

  function handleAnnouncementSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!annTitle.trim() || !annDetail.trim()) return;
    onPublishAnnouncement(annTitle.trim(), annDetail.trim());
    setAnnTitle('');
    setAnnDetail('');
    setAnnSent('Announcement broadcast to Students and Parent Real-Time Alerts.');
    setTimeout(() => setAnnSent(''), 3500);
  }

  function handleDirectMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!msgBody.trim()) return;
    const channel = msgRecipient.includes('Omprakash') ? 'faculty-student' : 'faculty-parent';
    onSendMessage(
      msgRecipient,
      msgSubject.trim() || 'Academic Update from Dr. Arvind Kulkarni',
      msgBody.trim(),
      channel
    );
    setMsgSubject('');
    setMsgBody('');
  }

  if (activeTab === 'courses') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-[#0F274A] dark:text-white">Course Management</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Upload lecture resources, manage GGSIPU syllabus units, and publish or grade assignments
            </p>
          </div>
          <select
            aria-label="Select active teaching course"
            value={selectedCourseCode}
            onChange={(e) => setSelectedCourseCode(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[#0F274A] dark:text-slate-100"
          >
            {campusState.courses.slice(0, 3).map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.title}
              </option>
            ))}
          </select>
        </div>

        {resSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{resSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleResourceSubmit} className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#0F274A] dark:text-white">
              <FilePlus2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-base font-display font-semibold">Upload Lecture Material</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="res-title">
                Material Title
              </label>
              <input
                id="res-title"
                type="text"
                required
                value={resTitle}
                onChange={(e) => setResTitle(e.target.value)}
                placeholder="e.g., Unit IV: Backpropagation Gradient Lecture Deck"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="res-type">
                  Resource Type
                </label>
                <select
                  id="res-type"
                  value={resType}
                  onChange={(e) => setResType(e.target.value as StudyResource['type'])}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="Lecture Notes">Lecture Notes</option>
                  <option value="Lab Manual">Lab Manual</option>
                  <option value="Question Bank">Question Bank</option>
                  <option value="Syllabus">Syllabus</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Code</label>
                <div className="px-3 py-2 text-sm font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200">
                  {activeCourse.code}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="res-summary">
                Topic Summary
              </label>
              <textarea
                id="res-summary"
                rows={2}
                value={resSummary}
                onChange={(e) => setResSummary(e.target.value)}
                placeholder="Brief summary for students..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 hover:bg-[#173766] dark:hover:bg-amber-500 rounded-lg cursor-pointer"
            >
              Publish to Student Hub
            </button>
          </form>

          <form onSubmit={handleAssignmentSubmit} className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white">
              Create &amp; Grade Assignments
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="asg-title">
                Assignment Title
              </label>
              <input
                id="asg-title"
                type="text"
                required
                value={asgTitle}
                onChange={(e) => setAsgTitle(e.target.value)}
                placeholder="e.g., Random Forest Hyperparameter Tuning Lab"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="asg-due">
                  Due Date
                </label>
                <input
                  id="asg-due"
                  type="text"
                  value={asgDue}
                  onChange={(e) => setAsgDue(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="asg-marks">
                  Max Marks
                </label>
                <input
                  id="asg-marks"
                  type="number"
                  min={5}
                  max={25}
                  value={asgMarks}
                  onChange={(e) => setAsgMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-[#0F274A] dark:text-amber-300 bg-amber-100 dark:bg-slate-800 hover:bg-amber-200 dark:hover:bg-slate-700 border border-amber-300 dark:border-slate-700 rounded-lg cursor-pointer"
            >
              Create Assignment
            </button>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Active Assignments (Click to grade)
              </div>
              <div className="space-y-2">
                {campusState.assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <span className="truncate">
                      <strong className="font-mono text-amber-700 dark:text-amber-400 mr-1.5">{a.courseCode}</strong>
                      {a.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setGradingAsg(a);
                        setGradeValue(a.score ?? a.maxMarks - 1);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {a.status === 'Graded' ? `Graded (${a.score}/${a.maxMarks})` : 'Grade'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Syllabus Unit Tracker */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white">
                GGSIPU Syllabus Progress — {activeCourse.code}: {activeCourse.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Click any unit status button to cycle progress</p>
            </div>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {activeCourse.syllabusUnits.map((unit) => (
              <div key={unit.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400 mr-2">{unit.unit}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{unit.topic}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleSyllabusUnit(activeCourse.code, unit.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                    unit.status === 'Completed'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                      : unit.status === 'In Progress'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {unit.status}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment Grading Modal */}
        {gradingAsg && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-md w-full overflow-hidden shadow-xl">
              <div className="px-5 py-4 bg-[#0F274A] text-white flex items-center justify-between">
                <h3 className="text-sm font-display font-bold">Grade Assignment Submission</h3>
                <button type="button" onClick={() => setGradingAsg(null)} className="text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onGradeAssignment(gradingAsg.id, gradeValue);
                  setGradingAsg(null);
                }}
                className="p-5 space-y-4"
              >
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <div className="font-mono font-semibold text-amber-700 dark:text-amber-400">{gradingAsg.courseCode}</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{gradingAsg.title}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Awarded Marks (Max {gradingAsg.maxMarks})
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={gradingAsg.maxMarks}
                    value={gradeValue}
                    onChange={(e) => setGradeValue(Math.min(gradingAsg.maxMarks, Math.max(0, Number(e.target.value))))}
                    className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setGradingAsg(null)}
                    className="px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 rounded-lg cursor-pointer"
                  >
                    Save Grade
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'roster') {
    const presentCount = campusState.roster.filter((s) => s.todayStatus === 'Present').length;
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-[#0F274A] dark:text-white">Attendance &amp; Grades Roster</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ETDS-305 Machine Learning · B.Tech CSE-DS Sem 5 · Live changes reflect in Student &amp; Parent portals
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Filter student or roll no..."
                className="pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                onSaveAttendanceBatch('Present');
                setRosterSavedMsg('Marked entire batch Present and committed lecture.');
                setTimeout(() => setRosterSavedMsg(''), 3500);
              }}
              className="px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => {
                const rows = [
                  'Enrollment No,Name,Branch,Today,Attended,Total,Internal,Mid-Term,Total Marks',
                  ...campusState.roster.map(
                    (s) =>
                      `${s.enrollmentNo},"${s.name}",${s.branch},${s.todayStatus},${s.attendedClasses},${s.totalClasses},${s.internalMarks},${s.midTermMarks},${s.internalMarks + s.midTermMarks}`
                  ),
                ];
                triggerTextDownload('DTC_ETDS305_Roster.csv', rows.join('\n'), 'text/csv;charset=utf-8');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0F274A] dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Roster</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onSaveAttendanceBatch();
                setRosterSavedMsg('Attendance committed to student & parent records.');
                setTimeout(() => setRosterSavedMsg(''), 3500);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 hover:bg-[#173766] dark:hover:bg-amber-500 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-amber-400 dark:text-white" />
              <span>Commit Lecture ({presentCount}/{campusState.roster.length})</span>
            </button>
          </div>
        </div>

        {rosterSavedMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{rosterSavedMsg}</span>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 font-semibold">Enrollment &amp; Student</th>
                  <th className="py-3 px-4 font-semibold">Today’s Roll</th>
                  <th className="py-3 px-4 font-semibold text-right">Term Attendance</th>
                  <th className="py-3 px-4 font-semibold text-right">Internal (25)</th>
                  <th className="py-3 px-4 font-semibold text-right">Mid-Term (25)</th>
                  <th className="py-3 px-4 font-semibold text-right">Total (50)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRoster.map((student) => {
                  const pct = (student.attendedClasses / student.totalClasses) * 100;
                  const totalMarks = student.internalMarks + student.midTermMarks;
                  return (
                    <tr key={student.enrollmentNo} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</div>
                        <div className="font-mono text-xs text-slate-500 dark:text-slate-400">{student.enrollmentNo}</div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onToggleStudentAttendance(student.enrollmentNo)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                            student.todayStatus === 'Present'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100'
                              : 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700 hover:bg-red-100'
                          }`}
                        >
                          {student.todayStatus}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span className={pct < 75 ? 'text-red-700 dark:text-red-400 font-semibold' : 'text-slate-800 dark:text-slate-200'}>
                          {pct.toFixed(1)}%
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                          ({student.attendedClasses}/{student.totalClasses})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          min={0}
                          max={25}
                          aria-label={`Internal marks for ${student.name}`}
                          value={student.internalMarks}
                          onChange={(e) =>
                            onUpdateStudentMarks(
                              student.enrollmentNo,
                              'internalMarks',
                              Math.min(25, Math.max(0, Number(e.target.value)))
                            )
                          }
                          className="w-16 px-2 py-1 text-right font-mono text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          min={0}
                          max={25}
                          aria-label={`Mid-term marks for ${student.name}`}
                          value={student.midTermMarks}
                          onChange={(e) =>
                            onUpdateStudentMarks(
                              student.enrollmentNo,
                              'midTermMarks',
                              Math.min(25, Math.max(0, Number(e.target.value)))
                            )
                          }
                          className="w-16 px-2 py-1 text-right font-mono text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded"
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#0F274A] dark:text-amber-400 tabular-nums">
                        {totalMarks}/50
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'communication') {
    const facultyMessages = campusState.messages.filter(
      (m) => m.channel === 'faculty-parent' || m.channel === 'faculty-student'
    );
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#0F274A] dark:text-white">Communication Hub</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Publish class-wide announcements and message students or parents directly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleAnnouncementSubmit} className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#0F274A] dark:text-white">
              <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-base font-display font-semibold">Class-Wide Announcement</h2>
            </div>
            {annSent && (
              <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                {annSent}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="ann-title">
                Notice Headline
              </label>
              <input
                id="ann-title"
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="e.g., Extra Lab Session for Unit III PCA"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="ann-detail">
                Announcement Body
              </label>
              <textarea
                id="ann-detail"
                rows={3}
                required
                value={annDetail}
                onChange={(e) => setAnnDetail(e.target.value)}
                placeholder="Details for B.Tech CSE-DS Sem 5 students & parents..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 hover:bg-[#173766] dark:hover:bg-amber-500 rounded-lg cursor-pointer"
            >
              Publish Notice
            </button>
          </form>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between gap-4">
            <div>
              <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white mb-3">
                Direct Student &amp; Parent Inbox
              </h2>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {facultyMessages.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        <strong className="text-slate-900 dark:text-white">{m.senderName}</strong> ({m.senderRole}) → {m.recipient}
                      </span>
                      <span className="font-mono">{m.timestamp}</span>
                    </div>
                    <div className="text-xs font-semibold text-[#0F274A] dark:text-amber-400 mt-1">{m.subject}</div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{m.body}</p>
                    {m.senderRole !== 'Faculty' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMsgRecipient(m.senderName === 'Omprakash' ? 'Omprakash' : 'Mrs. Meera Sharma');
                          setMsgSubject(`Re: ${m.subject}`);
                        }}
                        className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Reply className="w-3 h-3" />
                        <span>Quick Reply</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleDirectMessage} className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  aria-label="Select recipient"
                  value={msgRecipient}
                  onChange={(e) => setMsgRecipient(e.target.value)}
                  className="px-3 py-2 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="Mrs. Meera Sharma">Mrs. Meera Sharma (Parent)</option>
                  <option value="Omprakash">Omprakash (Student)</option>
                </select>
                <input
                  type="text"
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  placeholder="Subject"
                  className="px-3 py-2 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  placeholder="Write a direct reply..."
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 hover:bg-[#173766] dark:hover:bg-amber-500 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400 dark:text-white" />
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Performance Analytics
  const classAvgMarks =
    campusState.roster.reduce((s, r) => s + r.internalMarks + r.midTermMarks, 0) /
    campusState.roster.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#0F274A] dark:text-white">Performance Analytics</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Course Outcome (CO) attainment, grade distributions, and batch mentoring insights
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setAnalyticsMetric('marks')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
              analyticsMetric === 'marks'
                ? 'bg-white dark:bg-slate-900 text-[#0F274A] dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Sessional Marks
          </button>
          <button
            type="button"
            onClick={() => setAnalyticsMetric('attendance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
              analyticsMetric === 'attendance'
                ? 'bg-white dark:bg-slate-900 text-[#0F274A] dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Attendance Standing
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Batch Mean Sessional Score</div>
          <div className="text-2xl font-display font-bold text-[#0F274A] dark:text-white mt-1 font-mono tabular-nums">
            {classAvgMarks.toFixed(1)} / 50
          </div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">82.4% Batch Mastery</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">NBA/AICTE CO Attainment</div>
          <div className="text-2xl font-display font-bold text-amber-700 dark:text-amber-400 mt-1 font-mono tabular-nums">
            78.6%
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Exceeds 70% target</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Students Needing Mentoring</div>
          <div className="text-2xl font-display font-bold text-red-700 dark:text-red-400 mt-1 font-mono tabular-nums">
            {campusState.roster.filter((s) => (s.attendedClasses / s.totalClasses) * 100 < 75).length}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Below 75% attendance threshold</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white mb-1">
            Live Grade Distribution (ETDS-305)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Automatically updates as you adjust roster marks
          </p>
          <VerticalBarChart data={gradeDistribution} maxValue={Math.max(4, campusState.roster.length)} />
        </div>

        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white mb-1">
            Course Outcome (CO) Attainment vs 70% Target
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            AICTE Outcome-Based Education (OBE) evaluation
          </p>
          <VerticalBarChart
            data={[
              { label: 'CO1', value: 86 },
              { label: 'CO2', value: 81 },
              { label: 'CO3', value: 74 },
              { label: 'CO4', value: 68 },
              { label: 'CO5', value: 79 },
            ]}
            maxValue={100}
            targetLine={70}
            unit="%"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-[#0F274A] dark:text-amber-400" />
          <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white">
            {analyticsMetric === 'marks' ? 'Student Sessional Score Comparison' : 'Student Attendance Percentage Comparison'}
          </h2>
        </div>
        {analyticsMetric === 'marks' ? (
          <HorizontalBarChart
            data={campusState.roster.map((s) => ({
              label: `${s.name} (${s.enrollmentNo})`,
              value: s.internalMarks + s.midTermMarks,
              maxValue: 50,
              sublabel: `${((s.attendedClasses / s.totalClasses) * 100).toFixed(0)}% att.`,
            }))}
            unit="/50"
            accentThreshold={34}
          />
        ) : (
          <HorizontalBarChart
            data={campusState.roster.map((s) => ({
              label: `${s.name} (${s.enrollmentNo})`,
              value: Number(((s.attendedClasses / s.totalClasses) * 100).toFixed(1)),
              maxValue: 100,
              sublabel: `${s.attendedClasses}/${s.totalClasses}`,
            }))}
            unit="%"
            accentThreshold={75}
          />
        )}
      </div>
    </div>
  );
}
