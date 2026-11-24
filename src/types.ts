export type PersonaRole = 'student' | 'faculty' | 'parent' | 'admin';

export type AppViewMode = 'landing' | 'workspace';

export interface CourseRecord {
  code: string;
  title: string;
  credits: number;
  faculty: string;
  attendedClasses: number;
  totalClasses: number;
  internalMarks: number; // out of 25
  midTermMarks: number; // out of 25
  projectedExternal: number; // out of 50
  gradeLetter: string;
  remarks: string;
  syllabusUnits: {
    id: string;
    unit: string;
    topic: string;
    status: 'Completed' | 'In Progress' | 'Upcoming';
  }[];
}

export interface SemesterGPA {
  semester: string;
  sgpa: number;
  cgpa: number;
  batchAvg: number;
  credits: number;
  status: 'Completed' | 'In Progress';
}

export interface StudyResource {
  id: string;
  courseCode: string;
  title: string;
  type: 'Lecture Notes' | 'Lab Manual' | 'Syllabus' | 'Question Bank';
  uploadedBy: string;
  date: string;
  size: string;
  summary: string;
}

export interface AssignmentItem {
  id: string;
  courseCode: string;
  title: string;
  dueDate: string;
  maxMarks: number;
  status: 'Pending' | 'Submitted' | 'Graded';
  score?: number;
  submittedAt?: string;
}

export interface TimetableSlot {
  id: string;
  time: string;
  courseCode: string;
  courseTitle: string;
  room: string;
  faculty: string;
  type: 'Lecture' | 'Lab' | 'Tutorial';
}

export interface CampusEvent {
  id: string;
  title: string;
  club: string;
  category: 'Technical' | 'Cultural' | 'Academic' | 'Sports';
  date: string;
  time: string;
  venue: string;
  rsvpCount: number;
  isRsvped: boolean;
  description: string;
}

export interface RosterStudent {
  enrollmentNo: string;
  name: string;
  branch: string;
  todayStatus: 'Present' | 'Absent';
  attendedClasses: number;
  totalClasses: number;
  internalMarks: number; // out of 25
  midTermMarks: number; // out of 25
  assignmentScore: number; // out of 10
}

export interface AlertItem {
  id: string;
  category: 'Attendance' | 'Academics' | 'Campus Notices';
  title: string;
  detail: string;
  timestamp: string;
  read: boolean;
  severity: 'info' | 'warning' | 'critical';
}

export interface MessageThreadItem {
  id: string;
  senderName: string;
  senderRole: 'Faculty' | 'Parent' | 'Student' | 'Administration';
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  channel: 'faculty-parent' | 'faculty-student' | 'admin-parent';
}

export interface BiometricLog {
  id: string;
  personName: string;
  personId: string;
  role: 'Student' | 'Faculty' | 'Staff';
  department: string;
  gate: string;
  timestamp: string;
  direction: 'Entry' | 'Exit';
}

export interface RoomBooking {
  id: string;
  roomName: string;
  capacity: number;
  date: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  eventTitle: string;
  organizer: string;
  status: 'Confirmed' | 'Institutional Hold';
}

export interface LibraryBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  department: string;
  status: 'Available' | 'Issued' | 'Overdue';
  borrowerName?: string;
  borrowerId?: string;
  dueDate?: string;
}

export interface FeeRecord {
  id: string;
  receiptNo: string;
  studentName: string;
  enrollmentNo: string;
  feeType: string;
  semester: string;
  amountInr: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  paidDate?: string;
  paymentMethod?: string;
}

export interface CampusState {
  courses: CourseRecord[];
  semesterHistory: SemesterGPA[];
  resources: StudyResource[];
  assignments: AssignmentItem[];
  timetable: TimetableSlot[];
  events: CampusEvent[];
  roster: RosterStudent[];
  alerts: AlertItem[];
  messages: MessageThreadItem[];
  biometricLogs: BiometricLog[];
  roomBookings: RoomBooking[];
  libraryBooks: LibraryBook[];
  feeRecords: FeeRecord[];
}
