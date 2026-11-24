import React, { useEffect, useState } from 'react';
import { INITIAL_CAMPUS_STATE } from './data/campusData';
import type {
  AppViewMode,
  AssignmentItem,
  BiometricLog,
  CampusState,
  PersonaRole,
  RoomBooking,
  StudyResource,
} from './types';
import { LandingPage } from './components/LandingPage';
import { WorkspaceShell } from './components/WorkspaceShell';

function computeGradeLetter(totalOutOf50: number): string {
  if (totalOutOf50 >= 45) return 'O';
  if (totalOutOf50 >= 41) return 'A+';
  if (totalOutOf50 >= 37) return 'A';
  if (totalOutOf50 >= 33) return 'B+';
  return 'B';
}

export default function App() {
  const [viewMode, setViewMode] = useState<AppViewMode>('workspace');
  const [activeRole, setActiveRole] = useState<PersonaRole>('student');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dtc-theme') === 'dark';
    } catch {
      return false;
    }
  });
  const [campusState, setCampusState] = useState<CampusState>(() =>
    structuredClone(INITIAL_CAMPUS_STATE)
  );

  // Sync dark mode class on <html> and persist preference
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('dtc-theme', darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage failures
    }
  }, [darkMode]);

  // Sync initial state from Express backend if available
  useEffect(() => {
    let active = true;
    fetch('/api/campus-state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data && Array.isArray(data.courses)) {
          setCampusState(data);
        }
      })
      .catch(() => {
        // Fallback smoothly to INITIAL_CAMPUS_STATE
      });
    return () => {
      active = false;
    };
  }, []);

  function updateCampusState(updater: (prev: CampusState) => CampusState) {
    setCampusState((prev) => {
      const next = updater(prev);
      fetch('/api/campus-state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }

  function handleEnterPortal(role: PersonaRole) {
    setActiveRole(role);
    setViewMode('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleResetDemoData() {
    const fresh = structuredClone(INITIAL_CAMPUS_STATE);
    setCampusState(fresh);
    fetch('/api/campus-state/reset', { method: 'POST' }).catch(() => {});
  }

  // Student Actions
  function handleSubmitAssignment(assignmentId: string) {
    const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    updateCampusState((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) =>
        a.id === assignmentId
          ? { ...a, status: 'Submitted', submittedAt: `Today, ${nowLabel}` }
          : a
      ),
    }));
  }

  function handleToggleRsvp(eventId: string) {
    updateCampusState((prev) => ({
      ...prev,
      events: prev.events.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              isRsvped: !ev.isRsvped,
              rsvpCount: ev.isRsvped ? ev.rsvpCount - 1 : ev.rsvpCount + 1,
            }
          : ev
      ),
    }));
  }

  // Faculty Actions
  function handleAddResource(res: Omit<StudyResource, 'id' | 'date'>) {
    const newRes: StudyResource = {
      ...res,
      id: `res-${Date.now()}`,
      date: '24 Nov 2026',
    };
    updateCampusState((prev) => ({
      ...prev,
      resources: [newRes, ...prev.resources],
    }));
  }

  function handleAddAssignment(asg: Omit<AssignmentItem, 'id' | 'status'>) {
    const newAsg: AssignmentItem = {
      ...asg,
      id: `asg-${Date.now()}`,
      status: 'Pending',
    };
    updateCampusState((prev) => ({
      ...prev,
      assignments: [newAsg, ...prev.assignments],
    }));
  }

  function handleGradeAssignment(assignmentId: string, score: number) {
    updateCampusState((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) =>
        a.id === assignmentId ? { ...a, status: 'Graded', score } : a
      ),
    }));
  }

  function handleToggleSyllabusUnit(courseCode: string, unitId: string) {
    const order: Array<'Upcoming' | 'In Progress' | 'Completed'> = [
      'Upcoming',
      'In Progress',
      'Completed',
    ];
    updateCampusState((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => {
        if (c.code !== courseCode) return c;
        return {
          ...c,
          syllabusUnits: c.syllabusUnits.map((u) => {
            if (u.id !== unitId) return u;
            const nextStatus = order[(order.indexOf(u.status) + 1) % order.length];
            return { ...u, status: nextStatus };
          }),
        };
      }),
    }));
  }

  function handleToggleStudentAttendance(enrollmentNo: string) {
    updateCampusState((prev) => ({
      ...prev,
      roster: prev.roster.map((s) =>
        s.enrollmentNo === enrollmentNo
          ? { ...s, todayStatus: s.todayStatus === 'Present' ? 'Absent' : 'Present' }
          : s
      ),
    }));
  }

  function handleSaveAttendanceBatch(allOverride?: 'Present' | 'Absent') {
    updateCampusState((prev) => {
      const updatedRoster = prev.roster.map((s) => {
        const effectiveStatus = allOverride ?? s.todayStatus;
        return {
          ...s,
          todayStatus: effectiveStatus,
          totalClasses: s.totalClasses + 1,
          attendedClasses: effectiveStatus === 'Present' ? s.attendedClasses + 1 : s.attendedClasses,
        };
      });
      const pratyush = updatedRoster.find((s) => s.enrollmentNo === '04215602723');
      const updatedCourses = prev.courses.map((c) => {
        if (c.code !== 'ETDS-305' || !pratyush) return c;
        return {
          ...c,
          attendedClasses: pratyush.attendedClasses,
          totalClasses: pratyush.totalClasses,
        };
      });

      const newAlert = pratyush
        ? {
            id: `alt-${Date.now()}`,
            category: 'Attendance' as const,
            title: `ETDS-305 Lecture Attendance Marked: ${pratyush.todayStatus}`,
            detail: `Dr. Arvind Kulkarni recorded today's Machine Learning lecture. Updated standing: ${pratyush.attendedClasses}/${pratyush.totalClasses} (${(
              (pratyush.attendedClasses / pratyush.totalClasses) *
              100
            ).toFixed(1)}%).`,
            timestamp: 'Just now',
            read: false,
            severity: pratyush.todayStatus === 'Absent' ? ('warning' as const) : ('info' as const),
          }
        : null;

      return {
        ...prev,
        roster: updatedRoster,
        courses: updatedCourses,
        alerts: newAlert ? [newAlert, ...prev.alerts] : prev.alerts,
      };
    });
  }

  function handleUpdateStudentMarks(
    enrollmentNo: string,
    field: 'internalMarks' | 'midTermMarks',
    value: number
  ) {
    updateCampusState((prev) => {
      const updatedRoster = prev.roster.map((s) =>
        s.enrollmentNo === enrollmentNo ? { ...s, [field]: value } : s
      );
      const pratyush = updatedRoster.find((s) => s.enrollmentNo === '04215602723');
      const updatedCourses = prev.courses.map((c) => {
        if (c.code !== 'ETDS-305' || !pratyush) return c;
        const total = pratyush.internalMarks + pratyush.midTermMarks;
        return {
          ...c,
          internalMarks: pratyush.internalMarks,
          midTermMarks: pratyush.midTermMarks,
          gradeLetter: computeGradeLetter(total),
        };
      });
      return {
        ...prev,
        roster: updatedRoster,
        courses: updatedCourses,
      };
    });
  }

  function handlePublishAnnouncement(title: string, detail: string) {
    updateCampusState((prev) => ({
      ...prev,
      alerts: [
        {
          id: `alt-${Date.now()}`,
          category: 'Campus Notices',
          title,
          detail,
          timestamp: 'Just now',
          read: false,
          severity: 'info',
        },
        ...prev.alerts,
      ],
    }));
  }

  function handleFacultyMessage(
    recipient: string,
    subject: string,
    body: string,
    channel: 'faculty-parent' | 'faculty-student'
  ) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    updateCampusState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: `msg-${Date.now()}`,
          senderName: 'Dr. Arvind Kulkarni',
          senderRole: 'Faculty',
          recipient,
          subject,
          body,
          timestamp: `Today, ${time}`,
          channel,
        },
      ],
    }));
  }

  // Parent Actions
  function handleMarkAllAlertsRead() {
    updateCampusState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => ({ ...a, read: true })),
    }));
  }

  function handleMarkAlertRead(alertId: string) {
    updateCampusState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
    }));
  }

  function handleSendParentMessage(
    recipient: string,
    subject: string,
    body: string,
    channel: 'faculty-parent' | 'admin-parent'
  ) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    updateCampusState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: `msg-${Date.now()}`,
          senderName: 'Mrs. Meera Sharma',
          senderRole: 'Parent',
          recipient,
          subject,
          body,
          timestamp: `Today, ${time}`,
          channel,
        },
      ],
    }));
  }

  // Admin Actions
  function handleSimulateBiometric(log: Omit<BiometricLog, 'id' | 'timestamp'>) {
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    updateCampusState((prev) => ({
      ...prev,
      biometricLogs: [
        {
          ...log,
          id: `bio-${Date.now()}`,
          timestamp: time,
        },
        ...prev.biometricLogs,
      ],
    }));
  }

  function handleAddRoomBooking(booking: Omit<RoomBooking, 'id' | 'capacity' | 'status'>) {
    const capMap: Record<string, number> = {
      'Main Auditorium': 400,
      'Seminar Hall A': 120,
      'CS Innovation Lab': 60,
      'Architecture Studio 2': 80,
    };
    updateCampusState((prev) => ({
      ...prev,
      roomBookings: [
        {
          ...booking,
          id: `rm-${Date.now()}`,
          capacity: capMap[booking.roomName] ?? 80,
          status: 'Confirmed',
        },
        ...prev.roomBookings,
      ],
    }));
  }

  function handleIssueBook(bookId: string, borrowerName: string, borrowerId: string) {
    updateCampusState((prev) => ({
      ...prev,
      libraryBooks: prev.libraryBooks.map((b) =>
        b.id === bookId
          ? {
              ...b,
              status: 'Issued',
              borrowerName,
              borrowerId,
              dueDate: '08 Dec 2026',
            }
          : b
      ),
    }));
  }

  function handleReturnBook(bookId: string) {
    updateCampusState((prev) => ({
      ...prev,
      libraryBooks: prev.libraryBooks.map((b) =>
        b.id === bookId
          ? {
              ...b,
              status: 'Available',
              borrowerName: undefined,
              borrowerId: undefined,
              dueDate: undefined,
            }
          : b
      ),
    }));
  }

  function handlePayFee(feeId: string, method: string) {
    updateCampusState((prev) => {
      const target = prev.feeRecords.find((f) => f.id === feeId);
      const updatedFees = prev.feeRecords.map((f) =>
        f.id === feeId
          ? {
              ...f,
              status: 'Paid' as const,
              paidDate: '24 Nov 2026',
              paymentMethod: method,
            }
          : f
      );
      const alert = target
        ? {
            id: `alt-${Date.now()}`,
            category: 'Campus Notices' as const,
            title: `Fee Payment Settled: ${target.receiptNo}`,
            detail: `INR ${target.amountInr.toLocaleString('en-IN')} (${target.feeType}) settled via ${method}. Official receipt is available in Fees & Payments.`,
            timestamp: 'Just now',
            read: false,
            severity: 'info' as const,
          }
        : null;

      return {
        ...prev,
        feeRecords: updatedFees,
        alerts: alert ? [alert, ...prev.alerts] : prev.alerts,
      };
    });
  }

  function handleSendFeeReminder(feeId: string) {
    updateCampusState((prev) => {
      const target = prev.feeRecords.find((f) => f.id === feeId);
      if (!target) return prev;
      return {
        ...prev,
        alerts: [
          {
            id: `alt-${Date.now()}`,
            category: 'Campus Notices',
            title: `Fee Due Advisory: ${target.receiptNo}`,
            detail: `Accounts Office reminder for ${target.studentName}: INR ${target.amountInr.toLocaleString('en-IN')} (${target.feeType}) is due by ${target.dueDate}.`,
            timestamp: 'Just now',
            read: false,
            severity: 'warning',
          },
          ...prev.alerts,
        ],
      };
    });
  }

  if (viewMode === 'landing') {
    return (
      <LandingPage
        campusState={campusState}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onEnterPortal={handleEnterPortal}
      />
    );
  }

  return (
    <WorkspaceShell
      role={activeRole}
      campusState={campusState}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode((d) => !d)}
      onChangeRole={setActiveRole}
      onBackToLanding={() => {
        setViewMode('landing');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      onResetDemoData={handleResetDemoData}
      onSubmitAssignment={handleSubmitAssignment}
      onToggleRsvp={handleToggleRsvp}
      onAddResource={handleAddResource}
      onAddAssignment={handleAddAssignment}
      onToggleSyllabusUnit={handleToggleSyllabusUnit}
      onToggleStudentAttendance={handleToggleStudentAttendance}
      onSaveAttendanceBatch={handleSaveAttendanceBatch}
      onUpdateStudentMarks={handleUpdateStudentMarks}
      onGradeAssignment={handleGradeAssignment}
      onPublishAnnouncement={handlePublishAnnouncement}
      onFacultyMessage={handleFacultyMessage}
      onMarkAllAlertsRead={handleMarkAllAlertsRead}
      onMarkAlertRead={handleMarkAlertRead}
      onSendParentMessage={handleSendParentMessage}
      onSimulateBiometric={handleSimulateBiometric}
      onAddRoomBooking={handleAddRoomBooking}
      onIssueBook={handleIssueBook}
      onReturnBook={handleReturnBook}
      onPayFee={handlePayFee}
      onSendFeeReminder={handleSendFeeReminder}
    />
  );
}
