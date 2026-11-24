import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCheck,
  Download,
  FileSpreadsheet,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';
import { HorizontalBarChart, SgpaTrendChart } from './Charts';
import type { CampusState, CourseRecord } from '../types';
import { triggerTextDownload } from '../utils/download';

export type ParentTab = 'alerts' | 'reports' | 'gpa' | 'messaging';

interface ParentPortalProps {
  activeTab: ParentTab;
  onSelectTab: (tab: ParentTab) => void;
  campusState: CampusState;
  onMarkAllAlertsRead: () => void;
  onMarkAlertRead: (alertId: string) => void;
  onSendParentMessage: (recipient: string, subject: string, body: string, channel: 'faculty-parent' | 'admin-parent') => void;
}

export function ParentPortal({
  activeTab,
  onSelectTab,
  campusState,
  onMarkAllAlertsRead,
  onMarkAlertRead,
  onSendParentMessage,
}: ParentPortalProps) {
  const [alertFilter, setAlertFilter] = useState<'All' | 'Attendance' | 'Academics' | 'Campus Notices'>('All');
  const [recipient, setRecipient] = useState<'Dr. Arvind Kulkarni' | 'Accounts & Registrar Office'>('Dr. Arvind Kulkarni');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseRecord | null>(null);
  const [quickInquirySent, setQuickInquirySent] = useState('');

  const latestSem = campusState.semesterHistory[campusState.semesterHistory.length - 1];
  const unreadCount = campusState.alerts.filter((a) => !a.read).length;

  const filteredAlerts = useMemo(() => {
    return campusState.alerts.filter((a) => alertFilter === 'All' || a.category === alertFilter);
  }, [campusState.alerts, alertFilter]);

  const parentMessages = useMemo(() => {
    return campusState.messages.filter(
      (m) => m.channel === 'faculty-parent' || m.channel === 'admin-parent'
    );
  }, [campusState.messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const channel = recipient === 'Dr. Arvind Kulkarni' ? 'faculty-parent' : 'admin-parent';
    onSendParentMessage(
      recipient,
      subject.trim() || `Parent Inquiry regarding Omprakash (04215602723)`,
      body.trim(),
      channel
    );
    setSubject('');
    setBody('');
  }

  function handleDownloadProgressReport() {
    const lines = [
      'DELHI TECHNICAL CAMPUS, GREATER NOIDA — PARENT ACADEMIC REPORT',
      'Ward: Omprakash | Enrollment: 04215602723 | B.Tech CSE-DS (Sem 5)',
      `CGPA: ${latestSem.cgpa.toFixed(2)} | Sem 5 SGPA: ${latestSem.sgpa.toFixed(2)}`,
      '------------------------------------------------------------------------',
      'Code,Course,Faculty,Attendance %,Internal+Midterm (50),Grade,Remarks',
      ...campusState.courses.map((c) => {
        const pct = ((c.attendedClasses / c.totalClasses) * 100).toFixed(1);
        return `${c.code},"${c.title}","${c.faculty}",${pct}%,${c.internalMarks + c.midTermMarks},${c.gradeLetter},"${c.remarks}"`;
      }),
    ];
    triggerTextDownload('DTC_Parent_Academic_Report_04215602723.csv', lines.join('\n'), 'text/csv;charset=utf-8');
  }

  if (activeTab === 'alerts') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-[#0F274A] dark:text-white">Real-Time Alerts</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Live attendance advisories, sessional scores, and campus circulars for Omprakash
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400 mr-1">
              {unreadCount} Unread
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('messaging')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 hover:bg-[#173766] dark:hover:bg-amber-500 rounded-lg cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400 dark:text-white" />
              <span>Message Faculty</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('reports')}
              className="px-3 py-2 text-xs font-semibold text-[#0F274A] dark:text-amber-300 bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 hover:bg-amber-100 rounded-lg cursor-pointer"
            >
              View Academic Report
            </button>
            <button
              type="button"
              onClick={onMarkAllAlertsRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F274A] dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Mark All Read</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg w-fit">
          {(['All', 'Attendance', 'Academics', 'Campus Notices'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setAlertFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                alertFilter === cat
                  ? 'bg-white dark:bg-slate-900 text-[#0F274A] dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const severityColor =
              alert.severity === 'critical'
                ? 'border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-950/40'
                : alert.severity === 'warning'
                ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/40'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
            const severityText =
              alert.severity === 'critical'
                ? 'text-red-800 dark:text-red-300'
                : alert.severity === 'warning'
                ? 'text-amber-800 dark:text-amber-300'
                : 'text-[#0F274A] dark:text-amber-400';

            return (
              <div
                key={alert.id}
                className={`border rounded-xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${severityColor}`}
              >
                <div className="flex items-start gap-3">
                  {alert.severity === 'critical' ? (
                    <AlertCircle className="w-5 h-5 text-red-700 dark:text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <Bell className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className={`font-semibold ${severityText}`}>{alert.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{alert.timestamp}</span>
                      {!alert.read && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-amber-700 dark:text-amber-400">New</span>
                        </>
                      )}
                    </div>
                    <h2 className="text-sm font-display font-bold text-slate-900 dark:text-white mt-1">{alert.title}</h2>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{alert.detail}</p>
                  </div>
                </div>

                {!alert.read && (
                  <button
                    type="button"
                    onClick={() => onMarkAlertRead(alert.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeTab === 'reports') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-[#0F274A] dark:text-white">Academic Reports</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Course-by-course marks, live attendance standings, and faculty remarks (click any row for details)
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadProgressReport}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 hover:bg-[#173766] dark:hover:bg-amber-500 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400 dark:text-white" />
            <span>Download Progress Report</span>
          </button>
        </div>

        {quickInquirySent && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            {quickInquirySent}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#0F274A] dark:text-amber-400" />
            <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white">
              Semester 5 Course Progress (B.Tech CSE-DS)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 font-semibold">Course</th>
                  <th className="py-3 px-4 font-semibold text-right">Attendance</th>
                  <th className="py-3 px-4 font-semibold text-right">Sessional (50)</th>
                  <th className="py-3 px-4 font-semibold text-right">Grade</th>
                  <th className="py-3 px-4 font-semibold">Faculty Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {campusState.courses.map((course) => {
                  const attPct = (course.attendedClasses / course.totalClasses) * 100;
                  return (
                    <tr
                      key={course.code}
                      onClick={() => setSelectedCourse(course)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs text-amber-700 dark:text-amber-400 font-semibold">{course.code}</div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{course.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{course.faculty}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span className={attPct < 75 ? 'text-red-700 dark:text-red-400 font-semibold' : 'text-slate-900 dark:text-slate-100'}>
                          {attPct.toFixed(1)}%
                        </span>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {course.attendedClasses}/{course.totalClasses}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#0F274A] dark:text-white tabular-nums">
                        {course.internalMarks + course.midTermMarks} / 50
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        {course.gradeLetter}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs">{course.remarks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white mb-4">
            Past Semester Standing (Sem 1–5)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {campusState.semesterHistory.map((sem) => (
              <div key={sem.semester} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="text-xs text-slate-500 dark:text-slate-400">{sem.semester} · {sem.credits} Cr</div>
                <div className="text-xl font-display font-bold text-[#0F274A] dark:text-white mt-1 font-mono tabular-nums">
                  {sem.sgpa.toFixed(2)}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{sem.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Course Inspection Modal */}
        {selectedCourse && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
              <div className="px-5 py-4 bg-[#0F274A] text-white flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-amber-300">{selectedCourse.code} · {selectedCourse.faculty}</div>
                  <h3 className="text-base font-display font-bold">{selectedCourse.title}</h3>
                </div>
                <button type="button" onClick={() => setSelectedCourse(null)} className="text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Attendance</div>
                    <div className="text-base font-mono font-bold text-[#0F274A] dark:text-white">
                      {((selectedCourse.attendedClasses / selectedCourse.totalClasses) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Internal + Mid</div>
                    <div className="text-base font-mono font-bold text-amber-700 dark:text-amber-400">
                      {selectedCourse.internalMarks + selectedCourse.midTermMarks}/50
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Projected Grade</div>
                    <div className="text-base font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {selectedCourse.gradeLetter}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>Faculty Notes:</strong> {selectedCourse.remarks}
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCourse(null)}
                    className="px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSendParentMessage(
                        'Dr. Arvind Kulkarni',
                        `Parent Inquiry: ${selectedCourse.code} (${selectedCourse.title})`,
                        `Hello, requesting a brief update on Omprakash's progress in ${selectedCourse.code}.`,
                        'faculty-parent'
                      );
                      setSelectedCourse(null);
                      setQuickInquirySent(`Sent quick progress inquiry regarding ${selectedCourse.code} to Faculty.`);
                      setTimeout(() => setQuickInquirySent(''), 3500);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 rounded-lg cursor-pointer"
                  >
                    Ask Faculty About Course
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'gpa') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#0F274A] dark:text-white">GPA &amp; CGPA Monitor</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Live academic standing and semester-over-semester performance benchmark
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">Current Cumulative GPA</div>
            <div className="text-3xl font-display font-bold text-[#0F274A] dark:text-white mt-1 font-mono tabular-nums">
              {latestSem.cgpa.toFixed(2)}
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">First Division with Distinction</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">Sem 5 Live SGPA</div>
            <div className="text-3xl font-display font-bold text-amber-700 dark:text-amber-400 mt-1 font-mono tabular-nums">
              {latestSem.sgpa.toFixed(2)}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Batch Average: {latestSem.batchAvg.toFixed(2)}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">GGSIPU Backlogs</div>
            <div className="text-3xl font-display font-bold text-emerald-700 dark:text-emerald-400 mt-1 font-mono tabular-nums">
              0
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">All core &amp; lab credits clear</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white mb-1">
              SGPA Growth vs Class Batch Average
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Consistent upward academic trajectory</p>
            <SgpaTrendChart
              data={campusState.semesterHistory.map((h) => ({
                label: h.semester,
                primary: h.sgpa,
                secondary: h.batchAvg,
              }))}
            />
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white mb-1">
              Current Course Standing (Out of 50)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Internal + Mid-Term evaluation</p>
            <HorizontalBarChart
              data={campusState.courses.map((c) => ({
                label: `${c.code} · ${c.title}`,
                value: c.internalMarks + c.midTermMarks,
                maxValue: 50,
                sublabel: c.gradeLetter,
              }))}
              unit="/50"
            />
          </div>
        </div>
      </div>
    );
  }

  // Secure Messaging
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-[#0F274A] dark:text-white">Secure Messaging</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Direct two-way channel with course faculty and Delhi Technical Campus administration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#0F274A] dark:text-white mb-2">
            <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-display font-semibold">Conversation History</h2>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {parentMessages.map((m) => (
              <div key={m.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    <strong className="text-slate-900 dark:text-white">{m.senderName}</strong> ({m.senderRole}) → {m.recipient}
                  </span>
                  <span className="font-mono">{m.timestamp}</span>
                </div>
                <div className="text-xs font-semibold text-[#0F274A] dark:text-amber-400 mt-1">{m.subject}</div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{m.body}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSend} className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 h-fit">
          <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white">
            New Message to Faculty / Administration
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="parent-recipient">
              Recipient
            </label>
            <select
              id="parent-recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value as typeof recipient)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            >
              <option value="Dr. Arvind Kulkarni">Dr. Arvind Kulkarni (Faculty Coordinator)</option>
              <option value="Accounts & Registrar Office">Accounts &amp; Registrar Office (Admin)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="parent-subject">
              Subject
            </label>
            <input
              id="parent-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Attendance & Exam Schedule Inquiry"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="parent-body">
              Message
            </label>
            <textarea
              id="parent-body"
              rows={4}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 hover:bg-[#173766] dark:hover:bg-amber-500 rounded-lg cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-amber-400 dark:text-white" />
            <span>Send Secure Message</span>
          </button>
        </form>
      </div>
    </div>
  );
}
