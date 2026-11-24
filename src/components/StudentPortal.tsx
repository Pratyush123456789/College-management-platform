import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Filter,
  Search,
  SlidersHorizontal,
  Upload,
  X,
} from 'lucide-react';
import { DonutGauge, HorizontalBarChart, SgpaTrendChart } from './Charts';
import type { CampusState, CourseRecord } from '../types';
import { triggerTextDownload } from '../utils/download';

export type StudentTab = 'academics' | 'attendance' | 'materials' | 'campus-life';

interface StudentPortalProps {
  activeTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
  campusState: CampusState;
  onSubmitAssignment: (assignmentId: string) => void;
  onToggleRsvp: (eventId: string) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;

export function StudentPortal({
  activeTab,
  onSelectTab,
  campusState,
  onSubmitAssignment,
  onToggleRsvp,
}: StudentPortalProps) {
  const [selectedTranscriptSem, setSelectedTranscriptSem] = useState<string>('Consolidated');
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [materialSearch, setMaterialSearch] = useState<string>('');
  const [eventCategory, setEventCategory] = useState<string>('All');
  const [recoveryCourseCode, setRecoveryCourseCode] = useState<string>('ETCS-309');
  const [downloadedNotice, setDownloadedNotice] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<(typeof WEEKDAYS)[number]>('Tue');
  const [inspectCourse, setInspectCourse] = useState<CourseRecord | null>(null);

  // Interactive What-If End-Term External Simulator (0-50 per course)
  const [simulatedExternals, setSimulatedExternals] = useState<Record<string, number>>(() =>
    Object.fromEntries(campusState.courses.map((c) => [c.code, c.projectedExternal]))
  );
  const [showSimulator, setShowSimulator] = useState(false);

  const latestSem = campusState.semesterHistory[campusState.semesterHistory.length - 1];
  const totalCredits = campusState.semesterHistory.reduce((s, h) => s + h.credits, 0);

  const simulatedGpa = useMemo(() => {
    let weightedSum = 0;
    let creditsSum = 0;
    campusState.courses.forEach((c) => {
      const ext = simulatedExternals[c.code] ?? c.projectedExternal;
      const total = c.internalMarks + c.midTermMarks + ext;
      let gp = 6;
      if (total >= 90) gp = 10;
      else if (total >= 80) gp = 9;
      else if (total >= 70) gp = 8;
      else if (total >= 60) gp = 7;
      weightedSum += gp * c.credits;
      creditsSum += c.credits;
    });
    const sgpa = creditsSum > 0 ? weightedSum / creditsSum : latestSem.sgpa;
    const prevTotalPoints = campusState.semesterHistory
      .slice(0, 4)
      .reduce((acc, s) => acc + s.sgpa * s.credits, 0);
    const prevCredits = campusState.semesterHistory
      .slice(0, 4)
      .reduce((acc, s) => acc + s.credits, 0);
    const cgpa = (prevTotalPoints + weightedSum) / (prevCredits + creditsSum);
    return { sgpa, cgpa };
  }, [campusState.courses, campusState.semesterHistory, latestSem.sgpa, simulatedExternals]);

  const attendanceSummary = useMemo(() => {
    const totalAttended = campusState.courses.reduce((s, c) => s + c.attendedClasses, 0);
    const totalHeld = campusState.courses.reduce((s, c) => s + c.totalClasses, 0);
    const overallPct = totalHeld > 0 ? (totalAttended / totalHeld) * 100 : 0;
    const lowCourses = campusState.courses.filter(
      (c) => (c.totalClasses > 0 ? (c.attendedClasses / c.totalClasses) * 100 : 100) < 75
    );
    return { totalAttended, totalHeld, overallPct, lowCourses };
  }, [campusState.courses]);

  const recoveryStats = useMemo(() => {
    const course =
      campusState.courses.find((c) => c.code === recoveryCourseCode) || campusState.courses[0];
    const pct = course.totalClasses > 0 ? (course.attendedClasses / course.totalClasses) * 100 : 100;
    let needed = 0;
    if (pct < 75) {
      needed = Math.max(0, Math.ceil(3 * course.totalClasses - 4 * course.attendedClasses));
    }
    return { course, pct, needed };
  }, [campusState.courses, recoveryCourseCode]);

  const filteredResources = useMemo(() => {
    return campusState.resources.filter((r) => {
      const matchesCourse = courseFilter === 'ALL' || r.courseCode === courseFilter;
      const q = materialSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.courseCode.toLowerCase().includes(q) ||
        r.uploadedBy.toLowerCase().includes(q);
      return matchesCourse && matchesSearch;
    });
  }, [campusState.resources, courseFilter, materialSearch]);

  const filteredAssignments = useMemo(() => {
    return campusState.assignments.filter(
      (a) => courseFilter === 'ALL' || a.courseCode === courseFilter
    );
  }, [campusState.assignments, courseFilter]);

  const filteredEvents = useMemo(() => {
    return campusState.events.filter(
      (ev) => eventCategory === 'All' || ev.category === eventCategory
    );
  }, [campusState.events, eventCategory]);

  const daySchedule = useMemo(() => {
    // Rotate slots realistically by selected weekday
    const offset = WEEKDAYS.indexOf(selectedDay);
    return campusState.timetable.map((slot, idx) => {
      const shifted = campusState.timetable[(idx + offset) % campusState.timetable.length];
      return {
        ...shifted,
        time: slot.time,
      };
    });
  }, [campusState.timetable, selectedDay]);

  function handleDownloadTranscript() {
    const header = [
      'DELHI TECHNICAL CAMPUS, GREATER NOIDA (Affiliated to GGSIPU)',
      `Official Student Academic Transcript (${selectedTranscriptSem})`,
      'Student: Omprakash | Enrollment: 04215602723 | Program: B.Tech CSE (Data Science)',
      `Current CGPA: ${latestSem.cgpa.toFixed(2)} | Total Credits: ${totalCredits}/160`,
      '------------------------------------------------------------------------',
      'Course Code,Title,Credits,Internal (25),Mid-Term (25),Proj. External (50),Grade',
    ];
    const rows = campusState.courses.map(
      (c) =>
        `${c.code},"${c.title}",${c.credits},${c.internalMarks},${c.midTermMarks},${c.projectedExternal},${c.gradeLetter}`
    );
    triggerTextDownload(
      `DTC_Transcript_04215602723_${selectedTranscriptSem.replace(/\s+/g, '_')}.csv`,
      [...header, ...rows].join('\n'),
      'text/csv;charset=utf-8'
    );
    setDownloadedNotice(`Transcript (${selectedTranscriptSem}) downloaded as CSV.`);
    setTimeout(() => setDownloadedNotice(''), 3500);
  }

  if (activeTab === 'academics') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-[#0F274A] dark:text-white">Academic Dashboard</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              GGSIPU B.Tech CSE (Data Science) · Semester 5 · Enrollment <span className="font-mono">04215602723</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSimulator((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showSimulator
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white dark:bg-slate-900 text-[#0F274A] dark:text-amber-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{showSimulator ? 'Hide What-If Simulator' : 'What-If GPA Simulator'}</span>
            </button>
            <select
              aria-label="Select transcript scope"
              value={selectedTranscriptSem}
              onChange={(e) => setSelectedTranscriptSem(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
            >
              <option value="Consolidated">Consolidated (Sem 1–5)</option>
              <option value="Semester 5">Semester 5 Provisional</option>
              <option value="Semester 4">Semester 4 Official</option>
            </select>
            <button
              type="button"
              onClick={handleDownloadTranscript}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 hover:bg-[#173766] dark:hover:bg-amber-500 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400 dark:text-white" aria-hidden="true" />
              <span>Download Transcript</span>
            </button>
          </div>
        </div>

        {downloadedNotice && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{downloadedNotice}</span>
          </div>
        )}

        {/* Quick Interactive Action Strip */}
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">Quick Actions:</span>
          <button
            type="button"
            onClick={() => onSelectTab('attendance')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-[#0F274A] hover:text-white dark:hover:bg-amber-600 rounded-lg transition-colors cursor-pointer"
          >
            Check 75% Attendance Recovery
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('materials')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-[#0F274A] hover:text-white dark:hover:bg-amber-600 rounded-lg transition-colors cursor-pointer"
          >
            Submit Pending Assignments ({campusState.assignments.filter((a) => a.status === 'Pending').length})
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('campus-life')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-[#0F274A] hover:text-white dark:hover:bg-amber-600 rounded-lg transition-colors cursor-pointer"
          >
            Explore Campus Events &amp; RSVP
          </button>
          <button
            type="button"
            onClick={() => setShowSimulator(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-50 dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
          >
            Open GPA Simulator
          </button>
        </div>

        {/* Interactive What-If SGPA/CGPA Simulator */}
        {showSimulator && (
          <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-600/60 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white">
                  Interactive GGSIPU End-Term SGPA &amp; CGPA Simulator
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Drag sliders to forecast your End-Term External score (0–50) across Sem 5 courses
                </p>
              </div>
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() =>
                    setSimulatedExternals(
                      Object.fromEntries(campusState.courses.map((c) => [c.code, c.projectedExternal]))
                    )
                  }
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Reset Sliders
                </button>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Projected SGPA</div>
                  <div className="text-xl font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                    {simulatedGpa.sgpa.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Projected CGPA</div>
                  <div className="text-xl font-mono font-bold text-[#0F274A] dark:text-white tabular-nums">
                    {simulatedGpa.cgpa.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campusState.courses.map((c) => {
                const ext = simulatedExternals[c.code] ?? c.projectedExternal;
                const total = c.internalMarks + c.midTermMarks + ext;
                return (
                  <div key={c.code} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">{c.code}</span>
                      <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        Total: <strong>{total}/100</strong>
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate mb-2">
                      {c.title}
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={15}
                        max={50}
                        aria-label={`Projected external score for ${c.title}`}
                        value={ext}
                        onChange={(e) =>
                          setSimulatedExternals((prev) => ({
                            ...prev,
                            [c.code]: Number(e.target.value),
                          }))
                        }
                        className="flex-1 accent-[#0F274A] dark:accent-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-mono tabular-nums w-12 text-right text-slate-700 dark:text-slate-300">
                        {ext}/50
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">Cumulative GPA (CGPA)</div>
            <div className="text-2xl font-display font-bold text-[#0F274A] dark:text-white mt-1 font-mono tabular-nums">
              {latestSem.cgpa.toFixed(2)}
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">First Division with Distinction</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">Semester 5 SGPA (Live)</div>
            <div className="text-2xl font-display font-bold text-amber-700 dark:text-amber-400 mt-1 font-mono tabular-nums">
              {latestSem.sgpa.toFixed(2)}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 tabular-nums">+1.11 above batch avg</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">Credits Completed</div>
            <div className="text-2xl font-display font-bold text-[#0F274A] dark:text-white mt-1 font-mono tabular-nums">
              {totalCredits} / 160
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">0 GGSIPU Backlogs</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">Aggregate Attendance</div>
            <div className="text-2xl font-display font-bold text-[#0F274A] dark:text-white mt-1 font-mono tabular-nums">
              {attendanceSummary.overallPct.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
              {attendanceSummary.lowCourses.length} subject below 75%
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white mb-1">
              Semester SGPA Progression vs Batch Average
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Hover points for semester comparison across GGSIPU Semesters 1 to 5
            </p>
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
              Sem 5 Sessional &amp; Internal Marks
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Click any subject bar to inspect its syllabus progress
            </p>
            <HorizontalBarChart
              data={campusState.courses.map((c) => ({
                label: `${c.code} · ${c.title}`,
                value: c.internalMarks + c.midTermMarks,
                maxValue: 50,
                sublabel: `Grade ${c.gradeLetter}`,
              }))}
              unit="/50"
              onSelectBar={(item) => {
                const code = item.label.split(' · ')[0];
                const found = campusState.courses.find((c) => c.code === code);
                if (found) setInspectCourse(found);
              }}
            />
          </div>
        </div>

        {/* Subject Marks Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white">
              Enrolled Courses &amp; Marks Breakdown (Sem 5)
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">Click any row to view syllabus units</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 font-semibold">Course</th>
                  <th className="py-3 px-4 font-semibold">Faculty</th>
                  <th className="py-3 px-4 font-semibold text-right">Credits</th>
                  <th className="py-3 px-4 font-semibold text-right">Internal (25)</th>
                  <th className="py-3 px-4 font-semibold text-right">Mid-Term (25)</th>
                  <th className="py-3 px-4 font-semibold text-right">Total (50)</th>
                  <th className="py-3 px-4 font-semibold text-right">Projected Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {campusState.courses.map((course) => (
                  <tr
                    key={course.code}
                    onClick={() => setInspectCourse(course)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs text-amber-700 dark:text-amber-400 font-semibold">{course.code}</div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{course.title}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{course.faculty}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{course.credits}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{course.internalMarks}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{course.midTermMarks}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-[#0F274A] dark:text-white">
                      {course.internalMarks + course.midTermMarks}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                      {course.gradeLetter}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Course Syllabus Inspection Modal */}
        {inspectCourse && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
              <div className="px-5 py-4 bg-[#0F274A] text-white flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-amber-300">{inspectCourse.code} · {inspectCourse.faculty}</div>
                  <h3 className="text-base font-display font-bold">{inspectCourse.title}</h3>
                </div>
                <button type="button" onClick={() => setInspectCourse(null)} aria-label="Close details" className="text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                  <strong className="text-slate-900 dark:text-white">Faculty Remark:</strong> {inspectCourse.remarks}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">GGSIPU Syllabus Units</div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                    {inspectCourse.syllabusUnits.map((u) => (
                      <div key={u.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="font-mono font-semibold text-amber-700 dark:text-amber-400 mr-2">{u.unit}</span>
                          <span className="text-slate-800 dark:text-slate-200">{u.topic}</span>
                        </div>
                        <span
                          className={`font-semibold shrink-0 ${
                            u.status === 'Completed'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : u.status === 'In Progress'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {u.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'attendance') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-[#0F274A] dark:text-white">Attendance Tracker</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Live subject-wise GGSIPU attendance compliance (75% mandatory threshold)
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const rows = [
                'Course Code,Course Title,Attended,Total,Percentage',
                ...campusState.courses.map(
                  (c) =>
                    `${c.code},"${c.title}",${c.attendedClasses},${c.totalClasses},${(
                      (c.attendedClasses / c.totalClasses) *
                      100
                    ).toFixed(1)}%`
                ),
              ];
              triggerTextDownload('DTC_Omprakash_Attendance.csv', rows.join('\n'), 'text/csv;charset=utf-8');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 hover:bg-[#173766] dark:hover:bg-amber-500 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400 dark:text-white" />
            <span>Export Attendance CSV</span>
          </button>
        </div>

        {attendanceSummary.lowCourses.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-700 dark:text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <div className="text-sm font-semibold text-red-900 dark:text-red-200">
                  Low-Attendance Notification: Action Required in {attendanceSummary.lowCourses.length} Subject
                </div>
                <p className="text-xs text-red-800 dark:text-red-300 mt-1 leading-relaxed">
                  {attendanceSummary.lowCourses
                    .map((c) => {
                      const pct = ((c.attendedClasses / c.totalClasses) * 100).toFixed(1);
                      return `${c.code} ${c.title} is at ${pct}% (${c.attendedClasses}/${c.totalClasses} classes)`;
                    })
                    .join(' · ')}
                  . Attendance updates immediately when faculty submits daily rosters.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex items-center">
            <DonutGauge
              percentage={attendanceSummary.overallPct}
              label="Aggregate Semester Attendance"
              sublabel={`${attendanceSummary.totalAttended} attended out of ${attendanceSummary.totalHeld} delivered lectures across 6 courses.`}
              threshold={75}
            />
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white mb-1">
              75% Eligibility Recovery Calculator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Select any course to compute consecutive lectures needed to maintain or regain 75% GGSIPU eligibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
              <select
                aria-label="Select course for recovery calculation"
                value={recoveryCourseCode}
                onChange={(e) => setRecoveryCourseCode(e.target.value)}
                className="px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 w-full sm:w-auto"
              >
                {campusState.courses.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} · {c.title}
                  </option>
                ))}
              </select>

              <div className="text-right">
                <div className="text-xs text-slate-500 dark:text-slate-400">Current Standing</div>
                <div
                  className={`text-lg font-mono font-bold tabular-nums ${
                    recoveryStats.pct < 75 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {recoveryStats.pct.toFixed(1)}% ({recoveryStats.course.attendedClasses}/{recoveryStats.course.totalClasses})
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                  {recoveryStats.needed > 0
                    ? `Attend next ${recoveryStats.needed} consecutive lectures to reach 75%`
                    : `Safe buffer: can miss up to ${Math.max(
                        0,
                        Math.floor((recoveryStats.course.attendedClasses - 0.75 * recoveryStats.course.totalClasses) / 0.75)
                      )} lectures`}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white mb-4">
            Subject-Wise Attendance Breakdown
          </h2>
          <div className="space-y-4">
            {campusState.courses.map((course) => {
              const pct = course.totalClasses > 0 ? (course.attendedClasses / course.totalClasses) * 100 : 100;
              const statusLabel =
                pct < 75 ? 'Low Attendance (<75%)' : pct < 80 ? 'Watch Zone (75–79%)' : 'Nominal (>=80%)';
              const barClass =
                pct < 75 ? 'bg-red-700 dark:bg-red-500' : pct < 80 ? 'bg-amber-600 dark:bg-amber-400' : 'bg-[#0F274A] dark:bg-sky-500';
              const textClass =
                pct < 75 ? 'text-red-700 dark:text-red-400' : pct < 80 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400';

              return (
                <div key={course.code} className="pb-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div>
                      <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400 mr-2">{course.code}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{course.title}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">· {course.faculty}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`font-semibold ${textClass}`}>{statusLabel}</span>
                      <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {pct.toFixed(1)}% ({course.attendedClasses}/{course.totalClasses})
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
                    <div className={`h-full ${barClass} transition-all duration-300`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'materials') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-[#0F274A] dark:text-white">Course Materials &amp; Schedule</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Filterable study resources, pending assignments, and weekly GGSIPU class schedule
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                placeholder="Search notes or faculty..."
                className="pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F274A] dark:focus:ring-amber-500"
              />
            </div>
            <div className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <select
                aria-label="Filter materials by subject"
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none"
              >
                <option value="ALL">All Subjects</option>
                {campusState.courses.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white mb-4">
            Assignments &amp; Lab Submissions
          </h2>
          {filteredAssignments.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400 py-4">No assignments match the selected course filter.</div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredAssignments.map((asg) => (
                <div key={asg.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">{asg.courseCode}</span>
                      <span aria-hidden="true">·</span>
                      <span>Due {asg.dueDate}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Max {asg.maxMarks} marks</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{asg.title}</div>
                    {asg.submittedAt && (
                      <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Submitted on {asg.submittedAt}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {asg.status === 'Pending' ? (
                      <button
                        type="button"
                        onClick={() => onSubmitAssignment(asg.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 hover:bg-[#173766] dark:hover:bg-amber-500 rounded-lg whitespace-nowrap cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400 dark:text-white" />
                        <span>Submit Assignment</span>
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                        {asg.status === 'Graded' ? `Graded: ${asg.score}/${asg.maxMarks}` : 'Submitted'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Study Resources */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white mb-4">
              Downloadable Study Resources
            </h2>
            {filteredResources.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400 py-6">
                No study resources matched your search. Clear filters to view all notes.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredResources.map((res) => (
                  <div key={res.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">{res.courseCode}</span>
                        <span aria-hidden="true">·</span>
                        <span>{res.type}</span>
                        <span aria-hidden="true">·</span>
                        <span>{res.uploadedBy}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{res.size}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#0F274A] dark:text-amber-400 shrink-0" aria-hidden="true" />
                        <span>{res.title}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{res.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        triggerTextDownload(
                          `${res.courseCode}_${res.title.replace(/[^a-zA-Z0-9]+/g, '_')}.txt`,
                          `${res.courseCode} - ${res.title}\nUploaded by: ${res.uploadedBy} (${res.date})\n\nSummary:\n${res.summary}\n`
                        )
                      }
                      className="px-3 py-1.5 text-xs font-semibold text-[#0F274A] dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Weekday Class Schedule */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white">Class Schedule</h2>
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`px-2 py-1 text-[11px] font-semibold rounded-md cursor-pointer ${
                      selectedDay === day
                        ? 'bg-white dark:bg-slate-900 text-[#0F274A] dark:text-amber-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {daySchedule.map((slot) => (
                <div key={`${selectedDay}-${slot.id}`} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono font-semibold text-[#0F274A] dark:text-amber-400 inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                      {slot.time}
                    </span>
                    <span>{slot.type} · {slot.room}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                    {slot.courseCode}: {slot.courseTitle}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{slot.faculty}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Campus Life Directory
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#0F274A] dark:text-white">Campus Life Directory</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Upcoming Greater Noida campus events, technical societies, and one-click RSVPs
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
          {['All', 'Technical', 'Academic', 'Cultural'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setEventCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                eventCategory === cat
                  ? 'bg-white dark:bg-slate-900 text-[#0F274A] dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredEvents.map((ev) => (
          <article key={ev.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span className="font-semibold text-amber-700 dark:text-amber-400">{ev.category}</span>
                <span aria-hidden="true">·</span>
                <span>{ev.club}</span>
              </div>
              <h2 className="text-lg font-display font-bold text-[#0F274A] dark:text-white">{ev.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{ev.description}</p>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0F274A] dark:text-amber-400" aria-hidden="true" />
                  <span>{ev.date} · {ev.time}</span>
                </div>
                <div>Venue: <span className="font-medium text-slate-900 dark:text-white">{ev.venue}</span></div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                {ev.rsvpCount} Registered Students
              </span>
              <button
                type="button"
                onClick={() => onToggleRsvp(ev.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  ev.isRsvped
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                    : 'bg-[#0F274A] dark:bg-amber-600 text-white hover:bg-[#173766] dark:hover:bg-amber-500'
                }`}
              >
                {ev.isRsvped ? 'RSVP Confirmed' : 'One-Click RSVP'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
