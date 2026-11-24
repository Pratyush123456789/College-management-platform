import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  Download,
  Fingerprint,
  Mail,
  Search,
  X,
} from 'lucide-react';
import { VerticalBarChart } from './Charts';
import type { BiometricLog, CampusState, FeeRecord, LibraryBook, RoomBooking } from '../types';
import { triggerTextDownload } from '../utils/download';

export type AdminTab = 'biometrics' | 'rooms' | 'library' | 'fees';

interface AdminPortalProps {
  activeTab: AdminTab;
  campusState: CampusState;
  onSimulateBiometric: (log: Omit<BiometricLog, 'id' | 'timestamp'>) => void;
  onAddRoomBooking: (booking: Omit<RoomBooking, 'id' | 'capacity' | 'status'>) => void;
  onIssueBook: (bookId: string, borrowerName: string, borrowerId: string) => void;
  onReturnBook: (bookId: string) => void;
  onPayFee: (feeId: string, method: string) => void;
  onSendFeeReminder: (feeId: string) => void;
}

const ROOM_OPTIONS = [
  { name: 'Main Auditorium', capacity: 400 },
  { name: 'Seminar Hall A', capacity: 120 },
  { name: 'CS Innovation Lab', capacity: 60 },
  { name: 'Architecture Studio 2', capacity: 80 },
];

const SLOT_WINDOWS = [
  { label: '09:00–11:00', start: '09:00', end: '11:00' },
  { label: '11:00–13:00', start: '11:00', end: '13:00' },
  { label: '14:00–16:00', start: '14:00', end: '16:00' },
  { label: '16:00–18:00', start: '16:00', end: '18:00' },
];

export function AdminPortal({
  activeTab,
  campusState,
  onSimulateBiometric,
  onAddRoomBooking,
  onIssueBook,
  onReturnBook,
  onPayFee,
  onSendFeeReminder,
}: AdminPortalProps) {
  // Biometric state
  const [bioName, setBioName] = useState('Omprakash');
  const [bioRole, setBioRole] = useState<BiometricLog['role']>('Student');
  const [bioDept, setBioDept] = useState('CSE-DS');
  const [bioGate, setBioGate] = useState('Block A Biometric Terminal');
  const [bioDir, setBioDir] = useState<BiometricLog['direction']>('Entry');
  const [bioSearch, setBioSearch] = useState('');
  const [bioFilter, setBioFilter] = useState<'All' | 'Entry' | 'Exit'>('All');

  // Room booking state
  const [roomName, setRoomName] = useState('Seminar Hall A');
  const [bookingDate, setBookingDate] = useState('2026-11-25');
  const [startTime, setStartTime] = useState('10:30');
  const [endTime, setEndTime] = useState('12:00');
  const [eventTitle, setEventTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [bookingFeedback, setBookingFeedback] = useState<{ type: 'error' | 'success'; msg: string } | null>(null);

  // Library state
  const [libSearch, setLibSearch] = useState('');
  const [libFilter, setLibFilter] = useState<'All' | 'Available' | 'Issued' | 'Overdue'>('All');
  const [issueTargetBook, setIssueTargetBook] = useState<LibraryBook | null>(null);
  const [borrowerName, setBorrowerName] = useState('Omprakash');
  const [borrowerId, setBorrowerId] = useState('04215602723');
  const [libNotice, setLibNotice] = useState('');

  // Fee Gateway state
  const [feeFilter, setFeeFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');
  const [gatewayFee, setGatewayFee] = useState<FeeRecord | null>(null);
  const [payMethod, setPayMethod] = useState('UPI / BHIM Campus Collect');
  const [paySuccessMsg, setPaySuccessMsg] = useState('');

  const deptAttendanceStats = useMemo(() => {
    const base = [
      { label: 'CSE-DS', value: 84 },
      { label: 'CSE', value: 81 },
      { label: 'IT', value: 79 },
      { label: 'ECE', value: 76 },
      { label: 'B.Arch', value: 88 },
    ];
    const extraCse = Math.min(8, campusState.biometricLogs.filter((l) => l.department === 'CSE-DS').length - 4);
    base[0].value = Math.min(99, base[0].value + Math.max(0, extraCse));
    return base;
  }, [campusState.biometricLogs]);

  const filteredBiometricLogs = useMemo(() => {
    const q = bioSearch.trim().toLowerCase();
    return campusState.biometricLogs.filter((l) => {
      const matchesDir = bioFilter === 'All' || l.direction === bioFilter;
      const matchesQ =
        !q ||
        l.personName.toLowerCase().includes(q) ||
        l.personId.toLowerCase().includes(q) ||
        l.gate.toLowerCase().includes(q);
      return matchesDir && matchesQ;
    });
  }, [campusState.biometricLogs, bioFilter, bioSearch]);

  const filteredBooks = useMemo(() => {
    return campusState.libraryBooks.filter((b) => {
      const matchesStatus = libFilter === 'All' || b.status === libFilter;
      const q = libSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.department.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [campusState.libraryBooks, libFilter, libSearch]);

  const filteredFees = useMemo(() => {
    return campusState.feeRecords.filter((f) => feeFilter === 'All' || f.status === feeFilter);
  }, [campusState.feeRecords, feeFilter]);

  const feeMetrics = useMemo(() => {
    const collected = campusState.feeRecords
      .filter((f) => f.status === 'Paid')
      .reduce((s, f) => s + f.amountInr, 0);
    const pending = campusState.feeRecords
      .filter((f) => f.status !== 'Paid')
      .reduce((s, f) => s + f.amountInr, 0);
    const total = collected + pending;
    const rate = total > 0 ? (collected / total) * 100 : 100;
    return { collected, pending, rate };
  }, [campusState.feeRecords]);

  function handleSimulateScan(e: React.FormEvent) {
    e.preventDefault();
    if (!bioName.trim()) return;
    const idMap: Record<string, string> = {
      'Omprakash': '04215602723',
      'Dr. Arvind Kulkarni': 'FAC-CSE-014',
      'Ananya Verma': '04315602723',
    };
    onSimulateBiometric({
      personName: bioName.trim(),
      personId: idMap[bioName.trim()] || `DTC-${Math.floor(1000 + Math.random() * 8999)}`,
      role: bioRole,
      department: bioDept,
      gate: bioGate,
      direction: bioDir,
    });
  }

  function handleExportBiometricsCsv() {
    const rows = [
      'Person,ID,Role,Department,Terminal Gate,Direction,Timestamp',
      ...filteredBiometricLogs.map(
        (l) => `"${l.personName}",${l.personId},${l.role},${l.department},"${l.gate}",${l.direction},${l.timestamp}`
      ),
    ];
    triggerTextDownload('DTC_Biometric_Attendance_Log.csv', rows.join('\n'), 'text/csv;charset=utf-8');
  }

  function handleRoomBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBookingFeedback(null);
    if (!eventTitle.trim() || !organizer.trim()) return;
    if (startTime >= endTime) {
      setBookingFeedback({ type: 'error', msg: 'End time must be after start time.' });
      return;
    }

    const conflict = campusState.roomBookings.find(
      (b) =>
        b.roomName === roomName &&
        b.date === bookingDate &&
        startTime < b.endTime &&
        endTime > b.startTime
    );

    if (conflict) {
      setBookingFeedback({
        type: 'error',
        msg: `Scheduling Conflict Detected: ${roomName} is already reserved on ${bookingDate} (${conflict.startTime}–${conflict.endTime}) for "${conflict.eventTitle}".`,
      });
      return;
    }

    onAddRoomBooking({
      roomName,
      date: bookingDate,
      startTime,
      endTime,
      eventTitle: eventTitle.trim(),
      organizer: organizer.trim(),
    });
    setEventTitle('');
    setOrganizer('');
    setBookingFeedback({
      type: 'success',
      msg: `Booking confirmed for ${roomName} on ${bookingDate} (${startTime}–${endTime}).`,
    });
  }

  function handleDownloadFeeReceipt(fee: FeeRecord) {
    const content = [
      '====================================================================',
      'DELHI TECHNICAL CAMPUS, GREATER NOIDA (Affiliated to GGSIPU)',
      'OFFICIAL FEE PAYMENT RECEIPT',
      '====================================================================',
      `Receipt Number : ${fee.receiptNo}`,
      `Student Name   : ${fee.studentName}`,
      `Enrollment No. : ${fee.enrollmentNo}`,
      `Fee Head       : ${fee.feeType}`,
      `Semester       : ${fee.semester}`,
      `Amount Paid    : INR ${fee.amountInr.toLocaleString('en-IN')}`,
      `Payment Method : ${fee.paymentMethod || 'Online Gateway'}`,
      `Payment Date   : ${fee.paidDate || '24 Nov 2026'}`,
      `Status         : ${fee.status.toUpperCase()}`,
      '--------------------------------------------------------------------',
      'Approved by AICTE & COA · Accounts & Registrar Office, Knowledge Park III',
    ].join('\n');
    triggerTextDownload(`DTC_Receipt_${fee.receiptNo}.txt`, content);
  }

  if (activeTab === 'biometrics') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-[#0F274A] dark:text-white">Campus Attendance &amp; Biometric System</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Automated campus-wide entry/exit log with live simulated biometric terminal integration
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportBiometricsCsv}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0F274A] dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Log</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSimulateScan} className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[#0F274A] dark:text-white">
                <Fingerprint className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h2 className="text-base font-display font-semibold">Simulate Biometric Scan</h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">One-Click Scan:</span>
              <button
                type="button"
                onClick={() =>
                  onSimulateBiometric({
                    personName: 'Omprakash',
                    personId: '04215602723',
                    role: 'Student',
                    department: 'CSE-DS',
                    gate: 'Block A Biometric Terminal',
                    direction: 'Entry',
                  })
                }
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-[#0F274A] hover:text-white dark:hover:bg-amber-600 rounded cursor-pointer"
              >
                Scan Omprakash
              </button>
              <button
                type="button"
                onClick={() =>
                  onSimulateBiometric({
                    personName: 'Dr. Arvind Kulkarni',
                    personId: 'FAC-CSE-014',
                    role: 'Faculty',
                    department: 'CSE-DS',
                    gate: 'Main Gate Turnstile 1',
                    direction: 'Entry',
                  })
                }
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-[#0F274A] hover:text-white dark:hover:bg-amber-600 rounded cursor-pointer"
              >
                Scan Faculty
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="bio-name">
                Person Name
              </label>
              <input
                id="bio-name"
                type="text"
                required
                value={bioName}
                onChange={(e) => setBioName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="bio-role">
                  Role
                </label>
                <select
                  id="bio-role"
                  value={bioRole}
                  onChange={(e) => setBioRole(e.target.value as BiometricLog['role'])}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="bio-dept">
                  Department
                </label>
                <select
                  id="bio-dept"
                  value={bioDept}
                  onChange={(e) => setBioDept(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="CSE-DS">CSE-DS</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="B.Arch">B.Arch</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="bio-gate">
                  Biometric Terminal
                </label>
                <select
                  id="bio-gate"
                  value={bioGate}
                  onChange={(e) => setBioGate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option>Main Gate Turnstile 1</option>
                  <option>Block A Biometric Terminal</option>
                  <option>Block B Biometric Terminal</option>
                  <option>Architecture Studio Reader</option>
                  <option>Central Library Gate</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="bio-dir">
                  Direction
                </label>
                <select
                  id="bio-dir"
                  value={bioDir}
                  onChange={(e) => setBioDir(e.target.value as BiometricLog['direction'])}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="Entry">Entry</option>
                  <option value="Exit">Exit</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 hover:bg-[#173766] dark:hover:bg-amber-500 rounded-lg cursor-pointer"
            >
              Trigger Biometric Check-In
            </button>
          </form>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white mb-1">
              Department-Wise Campus Turnout Today
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Percentage of enrolled students &amp; faculty checked in via biometric gates
            </p>
            <VerticalBarChart data={deptAttendanceStats} maxValue={100} targetLine={75} unit="%" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white">
              Live Biometric Gate Feed ({filteredBiometricLogs.length} Events)
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bioSearch}
                  onChange={(e) => setBioSearch(e.target.value)}
                  placeholder="Search person or gate..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {(['All', 'Entry', 'Exit'] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setBioFilter(dir)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                      bioFilter === dir
                        ? 'bg-white dark:bg-slate-900 text-[#0F274A] dark:text-amber-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 font-semibold">Person</th>
                  <th className="py-3 px-4 font-semibold">Role · Dept</th>
                  <th className="py-3 px-4 font-semibold">Terminal Gate</th>
                  <th className="py-3 px-4 font-semibold">Direction</th>
                  <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredBiometricLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{log.personName}</div>
                      <div className="font-mono text-xs text-slate-500 dark:text-slate-400">{log.personId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{log.role} · {log.department}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{log.gate}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-semibold ${
                          log.direction === 'Entry'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {log.direction}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'rooms') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#0F274A] dark:text-white">Events &amp; Room Booking</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Interactive venue slot matrix with automated overlap detection and live student RSVP counts
          </p>
        </div>

        {/* Interactive Venue Slot Grid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white">
                Interactive Venue Availability Matrix ({bookingDate})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any open slot to pre-fill the reservation form below
              </p>
            </div>
            <input
              type="date"
              aria-label="Filter matrix date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-4 font-semibold">Campus Venue</th>
                  {SLOT_WINDOWS.map((slot) => (
                    <th key={slot.label} className="py-2.5 px-2 font-mono font-semibold text-center">
                      {slot.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {ROOM_OPTIONS.map((rm) => (
                  <tr key={rm.name}>
                    <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {rm.name} <span className="text-slate-400 dark:text-slate-500 font-mono">({rm.capacity})</span>
                    </td>
                    {SLOT_WINDOWS.map((slot) => {
                      const existing = campusState.roomBookings.find(
                        (b) =>
                          b.roomName === rm.name &&
                          b.date === bookingDate &&
                          slot.start < b.endTime &&
                          slot.end > b.startTime
                      );
                      return (
                        <td key={slot.label} className="py-2 px-1.5">
                          {existing ? (
                            <div
                              title={existing.eventTitle}
                              className="px-2 py-2 rounded-md bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-center font-medium truncate max-w-[140px] mx-auto"
                            >
                              Booked
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setRoomName(rm.name);
                                setStartTime(slot.start);
                                setEndTime(slot.end);
                                setBookingFeedback(null);
                              }}
                              className="w-full px-2 py-2 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold transition-colors cursor-pointer"
                            >
                              Reserve
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleRoomBookingSubmit} className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#0F274A] dark:text-white">
              <CalendarCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-base font-display font-semibold">Reserve Campus Venue</h2>
            </div>

            {bookingFeedback && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  bookingFeedback.type === 'error'
                    ? 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {bookingFeedback.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{bookingFeedback.msg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="rm-select">
                Room / Venue
              </label>
              <select
                id="rm-select"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                {ROOM_OPTIONS.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name} ({r.capacity} seats)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="rm-date">
                  Date
                </label>
                <input
                  id="rm-date"
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="rm-start">
                  Start
                </label>
                <input
                  id="rm-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="rm-end">
                  End
                </label>
                <input
                  id="rm-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="rm-title">
                Event / Academic Purpose
              </label>
              <input
                id="rm-title"
                type="text"
                required
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g., Robotics Club Orientation"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="rm-org">
                Organizer / Department
              </label>
              <input
                id="rm-org"
                type="text"
                required
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="e.g., Dept. of CSE-DS"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 hover:bg-[#173766] dark:hover:bg-amber-500 rounded-lg cursor-pointer"
            >
              Check Availability &amp; Book Room
            </button>
          </form>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white">
                  Confirmed Venue Schedule
                </h2>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {campusState.roomBookings.map((b) => (
                  <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono text-amber-700 dark:text-amber-400 font-semibold">
                        {b.date} · {b.startTime}–{b.endTime} · {b.roomName}
                      </div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{b.eventTitle}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Organizer: {b.organizer}</div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">{b.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <h2 className="text-base font-display font-semibold text-[#0F274A] dark:text-white mb-3">
                Student Club Event RSVPs (Live Sync)
              </h2>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {campusState.events.map((ev) => (
                  <div key={ev.id} className="py-2.5 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{ev.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{ev.date} · {ev.venue}</div>
                    </div>
                    <div className="font-mono text-xs font-semibold text-[#0F274A] dark:text-amber-400 tabular-nums shrink-0">
                      {ev.rsvpCount} RSVPs
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'library') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-[#0F274A] dark:text-white">Library Management</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Central DTC digital catalog, issued volumes, borrower IDs, and due date tracking
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={libSearch}
                onChange={(e) => setLibSearch(e.target.value)}
                placeholder="Search title, ISBN, author..."
                className="pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
              {(['All', 'Available', 'Issued', 'Overdue'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setLibFilter(status)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    libFilter === status
                      ? 'bg-white dark:bg-slate-900 text-[#0F274A] dark:text-amber-400'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {libNotice && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{libNotice}</span>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4 font-semibold">Volume &amp; ISBN</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Borrower / Due Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#0F274A] dark:text-amber-400 shrink-0" />
                        <span>{book.title}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {book.author} · <span className="font-mono">{book.isbn}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{book.department}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-semibold ${
                          book.status === 'Available'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : book.status === 'Overdue'
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {book.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300">
                      {book.borrowerName ? (
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">{book.borrowerName} ({book.borrowerId})</div>
                          <div className="font-mono text-slate-500 dark:text-slate-400">Due {book.dueDate}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">On Central Shelf</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {book.status === 'Available' ? (
                        <button
                          type="button"
                          onClick={() => setIssueTargetBook(book)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 hover:bg-[#173766] dark:hover:bg-amber-500 rounded-lg cursor-pointer"
                        >
                          Issue Book
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onReturnBook(book.id);
                            setLibNotice(`Marked "${book.title}" as returned to Central Library.`);
                            setTimeout(() => setLibNotice(''), 3000);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                        >
                          Mark Returned
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredBooks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No library volumes matched your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Issue Book Modal */}
        {issueTargetBook && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 max-w-md w-full overflow-hidden shadow-xl">
              <div className="px-5 py-4 bg-[#0F274A] text-white flex items-center justify-between">
                <h3 className="text-sm font-display font-bold">Issue Library Volume</h3>
                <button type="button" onClick={() => setIssueTargetBook(null)} className="text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!borrowerName.trim() || !borrowerId.trim()) return;
                  onIssueBook(issueTargetBook.id, borrowerName.trim(), borrowerId.trim());
                  setLibNotice(`Issued "${issueTargetBook.title}" to ${borrowerName.trim()}.`);
                  setIssueTargetBook(null);
                  setTimeout(() => setLibNotice(''), 3000);
                }}
                className="p-5 space-y-4"
              >
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Volume: <strong className="text-slate-900 dark:text-white">{issueTargetBook.title}</strong>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Borrower Name</label>
                  <input
                    type="text"
                    required
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Enrollment / Faculty ID</label>
                  <input
                    type="text"
                    required
                    value={borrowerId}
                    onChange={(e) => setBorrowerId(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIssueTargetBook(null)}
                    className="px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 rounded-lg cursor-pointer"
                  >
                    Confirm Issue (14 Days)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fees & Payments
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#0F274A] dark:text-white">Fees &amp; Payments</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Integrated student fee ledger, downloadable official receipts, and simulated payment gateway
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg w-fit">
            {(['All', 'Paid', 'Pending', 'Overdue'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFeeFilter(status)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                  feeFilter === status
                    ? 'bg-white dark:bg-slate-900 text-[#0F274A] dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const rows = [
                'Receipt No,Student,Enrollment,Fee Head,Semester,Amount INR,Status',
                ...filteredFees.map(
                  (f) =>
                    `${f.receiptNo},"${f.studentName}",${f.enrollmentNo},"${f.feeType}","${f.semester}",${f.amountInr},${f.status}`
                ),
              ];
              triggerTextDownload('DTC_Fee_Ledger.csv', rows.join('\n'), 'text/csv;charset=utf-8');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0F274A] dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Ledger</span>
          </button>
        </div>
      </div>

      {paySuccessMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{paySuccessMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Collected (Current Ledger)</div>
          <div className="text-2xl font-display font-bold text-emerald-700 dark:text-emerald-400 mt-1 font-mono tabular-nums">
            INR {feeMetrics.collected.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Reconciled with SBI / HDFC</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Pending &amp; Overdue Dues</div>
          <div className="text-2xl font-display font-bold text-amber-700 dark:text-amber-400 mt-1 font-mono tabular-nums">
            INR {feeMetrics.pending.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Exam &amp; Hostel instalments</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Collection Completion Rate</div>
          <div className="text-2xl font-display font-bold text-[#0F274A] dark:text-white mt-1 font-mono tabular-nums">
            {feeMetrics.rate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Odd Semester 2026–27</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold">Receipt &amp; Student</th>
                <th className="py-3 px-4 font-semibold">Fee Head · Semester</th>
                <th className="py-3 px-4 font-semibold text-right">Amount (INR)</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredFees.map((fee) => (
                <tr key={fee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{fee.studentName}</div>
                    <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {fee.enrollmentNo} · {fee.receiptNo}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-900 dark:text-slate-100">{fee.feeType}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{fee.semester} · Due {fee.dueDate}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-[#0F274A] dark:text-white tabular-nums">
                    ₹{fee.amountInr.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-semibold ${
                        fee.status === 'Paid'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : fee.status === 'Overdue'
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {fee.status}
                    </span>
                    {fee.paidDate && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{fee.paidDate}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {fee.status === 'Paid' ? (
                      <button
                        type="button"
                        onClick={() => handleDownloadFeeReceipt(fee)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F274A] dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSendFeeReminder(fee.id);
                            setPaySuccessMsg(`Fee reminder dispatched to Parent Portal for ${fee.studentName} (${fee.receiptNo}).`);
                            setTimeout(() => setPaySuccessMsg(''), 3500);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Remind</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGatewayFee(fee)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Gateway</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulated Payment Gateway Modal */}
      {gatewayFee && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 max-w-md w-full overflow-hidden shadow-xl">
            <div className="px-5 py-4 bg-[#0F274A] text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-300">DTC Fee Gateway Simulation</div>
                <h3 className="text-sm font-display font-bold">{gatewayFee.receiptNo}</h3>
              </div>
              <button type="button" onClick={() => setGatewayFee(null)} className="text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Student</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{gatewayFee.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Fee Head</span>
                  <span className="font-medium text-slate-900 dark:text-slate-200">{gatewayFee.feeType}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Payable Total</span>
                  <span className="font-mono font-bold text-[#0F274A] dark:text-amber-400">
                    INR {gatewayFee.amountInr.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Payment Rail</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option>UPI / BHIM Campus Collect</option>
                  <option>HDFC / SBI NetBanking</option>
                  <option>RuPay / Visa Debit Card</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGatewayFee(null)}
                  className="px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onPayFee(gatewayFee.id, payMethod);
                    setPaySuccessMsg(
                      `Payment of INR ${gatewayFee.amountInr.toLocaleString('en-IN')} settled for ${gatewayFee.studentName} (${gatewayFee.receiptNo}). Receipt ready.`
                    );
                    setGatewayFee(null);
                    setTimeout(() => setPaySuccessMsg(''), 4500);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                >
                  Authorize &amp; Settle Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
