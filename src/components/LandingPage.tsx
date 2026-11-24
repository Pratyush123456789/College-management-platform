import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  GraduationCap,
  Lock,
  Moon,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sun,
  X,
} from 'lucide-react';
import { CAMPUS_IMAGES } from '../data/campusData';
import type { CampusState, PersonaRole } from '../types';

interface LandingPageProps {
  campusState: CampusState;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onEnterPortal: (role: PersonaRole) => void;
}

const TOUR_STEPS: Array<{
  role: PersonaRole;
  title: string;
  subtitle: string;
  summary: string;
  highlights: string[];
}> = [
  {
    role: 'student',
    title: '01. Student Hub',
    subtitle: 'Academic standing, live attendance & campus life',
    summary:
      'Omprakash (B.Tech CSE-DS, Sem 5) tracks GGSIPU SGPA/CGPA progression, simulates end-term grades, checks 75% attendance eligibility per subject, downloads notes, and RSVPs to campus events.',
    highlights: [
      'Interactive What-If SGPA/CGPA simulator & CSV transcript downloads',
      'Instant low-attendance recovery calculator (<75% alerts)',
      'Weekly GGSIPU class schedule, materials & one-click club RSVPs',
    ],
  },
  {
    role: 'faculty',
    title: '02. Faculty Suite',
    subtitle: 'Course delivery, roster grading & outcome analytics',
    summary:
      'Dr. Arvind Kulkarni uploads lecture notes, updates GGSIPU syllabus units, marks daily class attendance with bulk actions, edits sessional marks, and broadcasts announcements.',
    highlights: [
      'Live class roster attendance synced to Student & Parent views',
      'Inline sessional & lab grading with automatic grade letters',
      'NBA/AICTE Course Outcome attainment & grade distribution charts',
    ],
  },
  {
    role: 'parent',
    title: '03. Parent Dashboard',
    subtitle: 'Transparent progress & direct faculty communication',
    summary:
      'Mrs. Meera Sharma receives real-time attendance advisories, inspects subject-level progress drawers, compares SGPA against batch averages, and messages faculty or the Registrar directly.',
    highlights: [
      'Real-time alerts for attendance thresholds & internal scores',
      'Course-wise academic report & SGPA progression chart',
      'Two-way messaging channel synced with Faculty & Admin',
    ],
  },
  {
    role: 'admin',
    title: '04. Campus Operations',
    subtitle: 'Biometrics, conflict-free venues, library & fee ledgers',
    summary:
      'Campus Operations oversees simulated biometric turnstile check-ins, prevents auditorium booking overlaps via an interactive slot matrix, manages library circulation, and reconciles fee payments.',
    highlights: [
      'Live biometric gate simulation across Block A, B & Library',
      'Interactive hourly room timeline with conflict prevention',
      'Integrated fee ledger with simulated UPI/Card gateway & receipts',
    ],
  },
];

const CHALLENGES = [
  {
    num: '01',
    title: 'Fragmented Systems',
    problem:
      'Disconnected spreadsheets for GGSIPU internal marks, attendance registers, library records, and fee receipts force staff to reconcile data manually across departments.',
    solution:
      'One unified institutional database links faculty rosters, student transcripts, library ledgers, and fee receipts in real time—eliminating duplicate entry.',
    metric: '100% single-source academic sync',
  },
  {
    num: '02',
    title: 'Low Engagement',
    problem:
      'Delayed circulars, opaque 75% attendance thresholds, and scattered WhatsApp club announcements leave students and parents unaware until end-term deadlines.',
    solution:
      'Automated low-attendance recovery advisories, parent real-time alerts, and one-click event RSVPs keep every stakeholder informed daily.',
    metric: 'Instant parent & student alerts',
  },
  {
    num: '03',
    title: 'Manual Processes',
    problem:
      'Paper-based auditorium booking slips, manual biometric attendance tallies, and physical fee counter queues consume hours of faculty and registrar bandwidth.',
    solution:
      'Automated room overlap detection, simulated biometric gate logging, and online UPI/Card receipt generation reduce administrative turnaround to seconds.',
    metric: 'Zero double-booked campus venues',
  },
];

const ROADMAP_PHASES = [
  {
    phase: 'Phase 1',
    timeline: 'Weeks 1–2',
    title: 'Setup, Data Migration & Customization',
    summary:
      'Import GGSIPU branch curricula, historical student transcripts, faculty rosters, room inventories, and configure Delhi Technical Campus branding.',
    deliverables: [
      'Map B.Tech, B.Arch (COA), and MBA/BBA credit structures',
      'Migrate student enrollment records & historical SGPA ledgers',
      'Configure Block A, Block B & Library biometric terminal IDs',
    ],
  },
  {
    phase: 'Phase 2',
    timeline: 'Weeks 3–4',
    title: 'Training & Onboarding for All Users',
    summary:
      'Hands-on department workshops for faculty coordinators, student council representatives, parent orientation sessions, and registrar staff.',
    deliverables: [
      'Faculty roster grading & CO attainment walkthroughs',
      'Student & Parent portal orientation guides',
      'Accounts & Library staff dry-run reconciliation',
    ],
  },
  {
    phase: 'Phase 3',
    timeline: 'Week 5 Onward',
    title: 'Go-Live with 24/7 Dedicated Support',
    summary:
      'Full campus rollout across Greater Noida blocks with live biometric monitoring, automated parent alerts, and round-the-clock engineering SLA.',
    deliverables: [
      'Live daily attendance & fee gateway activation',
      'Continuous GGSIPU examination form compliance checks',
      'Dedicated Greater Noida campus support engineer',
    ],
  },
];

export function LandingPage({
  campusState,
  darkMode,
  onToggleDarkMode,
  onEnterPortal,
}: LandingPageProps) {
  const [activePreview, setActivePreview] = useState<'student' | 'faculty' | 'parent'>('student');
  const [flippedChallenges, setFlippedChallenges] = useState<Record<string, boolean>>({});
  const [activePhase, setActivePhase] = useState<number>(0);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);

  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoRole, setDemoRole] = useState('Director / Dean');
  const [demoDept, setDemoDept] = useState('B.Tech CSE & Allied');
  const [demoError, setDemoError] = useState('');
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  const [heroImgError, setHeroImgError] = useState(false);
  const [labImgError, setLabImgError] = useState(false);

  const currentTourStep = TOUR_STEPS[tourStepIndex];

  const avgAttendance =
    campusState.courses.reduce(
      (acc, c) => acc + (c.totalClasses > 0 ? (c.attendedClasses / c.totalClasses) * 100 : 0),
      0
    ) / campusState.courses.length;

  const latestSem = campusState.semesterHistory[campusState.semesterHistory.length - 1];

  function toggleChallenge(num: string) {
    setFlippedChallenges((prev) => ({ ...prev, [num]: !prev[num] }));
  }

  async function handleDemoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDemoError('');
    if (!demoName.trim() || !demoEmail.includes('@')) {
      setDemoError('Please provide your full name and a valid institutional email address.');
      return;
    }
    setDemoSubmitting(true);
    try {
      const res = await fetch('/api/demo-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: demoName,
          email: demoEmail,
          role: demoRole,
          department: demoDept,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not submit request.');
      }
      setDemoSubmitted(true);
    } catch {
      setDemoSubmitted(true);
    } finally {
      setDemoSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#0F274A] dark:text-white whitespace-nowrap shrink-0 font-display"
          >
            <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <span>Delhi Technical Campus</span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#challenges" className="hover:text-[#0F274A] dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
              Challenges
            </a>
            <a href="#platform" className="hover:text-[#0F274A] dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
              Platform
            </a>
            <a href="#why-us" className="hover:text-[#0F274A] dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
              Why DTC
            </a>
            <a href="#roadmap" className="hover:text-[#0F274A] dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
              Roadmap
            </a>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => onEnterPortal('student')}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#0F274A] dark:bg-amber-600 rounded-lg hover:bg-[#173766] dark:hover:bg-amber-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Workspace
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Section */}
        <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-[1280px] mx-auto px-6 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-between gap-8">
                <div className="space-y-5">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                    <span className="text-[#0F274A] dark:text-amber-400 font-semibold">Greater Noida</span>
                    <span aria-hidden="true">·</span>
                    <span>Affiliated to GGSIPU</span>
                    <span aria-hidden="true">·</span>
                    <span>Approved by AICTE &amp; COA</span>
                  </div>

                  <h1
                    className="font-display font-bold text-[#0F274A] dark:text-white tracking-tight leading-[1.12]"
                    style={{ fontSize: 'clamp(2.25rem, 3.6vw, 3.35rem)', textWrap: 'balance' }}
                  >
                    College Management Platform: A complete digital ecosystem for campus life
                  </h1>

                  <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                    Unifying GGSIPU academic records, live subject attendance, faculty workflows, parent progress alerts, and Greater Noida campus operations in one coherent institutional workspace.
                  </p>

                  {/* Primary Action Pair */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTourStepIndex(0);
                        setTourOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0F274A] dark:bg-amber-600 rounded-lg hover:bg-[#173766] dark:hover:bg-amber-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Compass className="w-4 h-4 text-amber-400 dark:text-white" aria-hidden="true" />
                      <span>Start the Tour</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDemoSubmitted(false);
                        setDemoError('');
                        setDemoOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#0F274A] dark:text-amber-300 bg-amber-50 dark:bg-slate-800 border border-amber-300 dark:border-slate-700 rounded-lg hover:bg-amber-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Book a Demo</span>
                      <ArrowRight className="w-4 h-4 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Quick-Jump Persona Controls */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
                    Quick-jump directly into an interactive portal:
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEnterPortal('student')}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-[#0F274A] hover:text-white dark:hover:bg-amber-600 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Students
                    </button>
                    <button
                      type="button"
                      onClick={() => onEnterPortal('faculty')}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-[#0F274A] hover:text-white dark:hover:bg-amber-600 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Faculty
                    </button>
                    <button
                      type="button"
                      onClick={() => onEnterPortal('parent')}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-[#0F274A] hover:text-white dark:hover:bg-amber-600 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Parents
                    </button>
                    <button
                      type="button"
                      onClick={() => onEnterPortal('admin')}
                      className="px-3.5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-slate-800 hover:bg-amber-600 hover:text-white border border-amber-200 dark:border-amber-700/60 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Campus Operations
                    </button>
                  </div>
                </div>
              </div>

              {/* Dominant Visual Focal Carrier */}
              <div className="lg:col-span-6 flex">
                <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#0F274A] min-h-[320px]">
                  {!heroImgError ? (
                    <img
                      src={CAMPUS_IMAGES.heroCampus}
                      alt="Delhi Technical Campus main academic building and courtyard in Greater Noida"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgError(true)}
                      className="w-full h-full object-cover lg:h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0F274A] via-[#173766] to-slate-900 flex flex-col items-center justify-center p-8 text-center">
                      <Building2 className="w-12 h-12 text-amber-400 mb-3" />
                      <div className="text-white font-display font-semibold text-lg">Delhi Technical Campus</div>
                      <div className="text-slate-300 text-sm">Knowledge Park III, Greater Noida</div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09172E]/85 via-[#09172E]/25 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-6 text-white">
                    <div className="text-xs text-amber-300 font-medium">
                      Knowledge Park III · Greater Noida Campus
                    </div>
                    <div className="text-base font-display font-semibold mt-1">
                      Unified Academic, Attendance &amp; Administrative Ledger
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Institutional Strip */}
            <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">University Framework</div>
                <div className="text-sm font-semibold text-[#0F274A] dark:text-slate-100 mt-1">GGSIPU Credit &amp; CGPA Engine</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Regulatory Alignment</div>
                <div className="text-sm font-semibold text-[#0F274A] dark:text-slate-100 mt-1">AICTE &amp; COA Audit Ready</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Live Role Workspaces</div>
                <div className="text-sm font-semibold text-[#0F274A] dark:text-slate-100 mt-1">Student · Faculty · Parent · Ops</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Hardware Integration</div>
                <div className="text-sm font-semibold text-[#0F274A] dark:text-slate-100 mt-1">Biometric Gate &amp; Library Sync</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Interactive Problem -> Resolution Cards */}
        <section id="challenges" className="py-16 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div className="max-w-2xl">
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">The Challenge</div>
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-[#0F274A] dark:text-white tracking-tight" style={{ textWrap: 'balance' }}>
                  Why traditional campus administration stalls academic velocity
                </h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Click any card to compare friction vs. digital resolution
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CHALLENGES.map((item) => {
                const isSolution = Boolean(flippedChallenges[item.num]);
                return (
                  <button
                    key={item.num}
                    type="button"
                    onClick={() => toggleChallenge(item.num)}
                    className={`text-left border rounded-xl p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                      isSolution
                        ? 'bg-[#0F274A] dark:bg-slate-900 text-white border-[#0F274A] dark:border-amber-500/70'
                        : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-[#0F274A]/50 dark:hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-mono font-semibold ${isSolution ? 'text-amber-300' : 'text-amber-700 dark:text-amber-400'}`}>
                          {item.num}
                        </span>
                        <span className={`text-xs font-medium ${isSolution ? 'text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
                          {isSolution ? 'Digital Resolution' : 'Legacy Friction'}
                        </span>
                      </div>
                      <h3 className={`text-lg font-display font-semibold mb-2 ${isSolution ? 'text-white' : 'text-[#0F274A] dark:text-white'}`}>
                        {item.title}
                      </h3>
                      <p className={`text-sm leading-relaxed ${isSolution ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>
                        {isSolution ? item.solution : item.problem}
                      </p>
                    </div>
                    <div className={`mt-6 pt-4 border-t text-xs flex items-center justify-between ${isSolution ? 'border-white/15 text-amber-300' : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      <span>{item.metric}</span>
                      <span className="font-semibold underline underline-offset-2">
                        {isSolution ? 'Show Problem' : 'View Resolution'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 3: Platform Overview */}
        <section id="platform" className="py-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
              <div className="max-w-2xl">
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Platform Overview</div>
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-[#0F274A] dark:text-white tracking-tight" style={{ textWrap: 'balance' }}>
                  Purpose-built workspaces for every stakeholder on campus
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onEnterPortal('admin')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F274A] dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Inspect Campus Operations Center</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-5 flex flex-col gap-3">
                {[
                  {
                    key: 'student' as const,
                    title: 'Student Hub',
                    meta: 'GGSIPU Transcripts · Attendance · Clubs',
                    desc: 'Live CGPA monitor, What-If grade simulator, subject-wise attendance recovery calculator, filterable study notes, and event RSVPs.',
                  },
                  {
                    key: 'faculty' as const,
                    title: 'Faculty Suite',
                    meta: 'Course Units · Roster Grading · Analytics',
                    desc: 'Upload lecture resources, mark batch attendance in seconds, update sessional marks, and view CO attainment charts.',
                  },
                  {
                    key: 'parent' as const,
                    title: 'Parent Dashboard',
                    meta: 'Real-Time Alerts · CGPA · Messaging',
                    desc: 'Instant attendance advisories, detailed semester progress reports, and direct messaging with faculty and administration.',
                  },
                ].map((card) => {
                  const selected = activePreview === card.key;
                  return (
                    <button
                      key={card.key}
                      type="button"
                      onClick={() => setActivePreview(card.key)}
                      className={`text-left p-5 rounded-xl border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#0F274A] dark:bg-slate-800 text-white border-[#0F274A] dark:border-amber-500'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className={`text-xs mb-1 ${selected ? 'text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        {card.meta}
                      </div>
                      <div className="text-lg font-display font-semibold">{card.title}</div>
                      <p className={`text-sm mt-1.5 leading-relaxed ${selected ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>
                        {card.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Live Interactive Snapshot Panel */}
              <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
                <div className="grid grid-cols-1 md:grid-cols-12 flex-1">
                  <div className="md:col-span-5 bg-slate-200 dark:bg-slate-800 min-h-[220px]">
                    {!labImgError ? (
                      <img
                        src={CAMPUS_IMAGES.innovationLab}
                        alt="Delhi Technical Campus students collaborating in the engineering innovation lab"
                        referrerPolicy="no-referrer"
                        onError={() => setLabImgError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#173766] flex items-center justify-center p-6 text-white text-sm">
                        DTC Innovation Lab
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-7 p-6 flex flex-col justify-between bg-white dark:bg-slate-900">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activePreview}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16 }}
                      >
                        <div className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                          Live Portal Preview · {activePreview === 'student' ? 'Student Hub' : activePreview === 'faculty' ? 'Faculty Suite' : 'Parent Dashboard'}
                        </div>
                        <h3 className="text-xl font-display font-bold text-[#0F274A] dark:text-white">
                          {activePreview === 'student'
                            ? 'Omprakash · B.Tech CSE-DS'
                            : activePreview === 'faculty'
                            ? 'Dr. Arvind Kulkarni · CSE-DS Coordinator'
                            : 'Mrs. Meera Sharma · Parent View'}
                        </h3>

                        <div className="mt-5 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                          {activePreview === 'student' && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Current CGPA (Sem 1–5)</span>
                                <span className="font-mono font-semibold text-[#0F274A] dark:text-white tabular-nums">{latestSem.cgpa.toFixed(2)} / 10</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Aggregate Attendance</span>
                                <span className="font-mono font-semibold text-[#0F274A] dark:text-white tabular-nums">{avgAttendance.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Pending Assignments</span>
                                <span className="font-mono font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                                  {campusState.assignments.filter((a) => a.status === 'Pending').length} Due
                                </span>
                              </div>
                            </>
                          )}

                          {activePreview === 'faculty' && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Active Section Roster</span>
                                <span className="font-mono font-semibold text-[#0F274A] dark:text-white tabular-nums">{campusState.roster.length} Students</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Uploaded Study Resources</span>
                                <span className="font-mono font-semibold text-[#0F274A] dark:text-white tabular-nums">{campusState.resources.length} Files</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Present Today (ETDS-305)</span>
                                <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                  {campusState.roster.filter((s) => s.todayStatus === 'Present').length}/{campusState.roster.length}
                                </span>
                              </div>
                            </>
                          )}

                          {activePreview === 'parent' && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Unread Campus Alerts</span>
                                <span className="font-mono font-semibold text-red-700 dark:text-red-400 tabular-nums">
                                  {campusState.alerts.filter((a) => !a.read).length} Advisories
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Sem 5 SGPA vs Batch Avg</span>
                                <span className="font-mono font-semibold text-[#0F274A] dark:text-white tabular-nums">
                                  {latestSem.sgpa.toFixed(2)} vs {latestSem.batchAvg.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Fee Ledger Balance</span>
                                <span className="font-mono font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                                  INR {campusState.feeRecords
                                    .filter((f) => f.enrollmentNo === '04215602723' && f.status !== 'Paid')
                                    .reduce((sum, f) => sum + f.amountInr, 0)
                                    .toLocaleString('en-IN')}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Interactive live state enabled</span>
                      <button
                        type="button"
                        onClick={() => onEnterPortal(activePreview)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 rounded-lg hover:bg-[#173766] dark:hover:bg-amber-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>Launch {activePreview === 'student' ? 'Student Hub' : activePreview === 'faculty' ? 'Faculty Suite' : 'Parent Portal'}</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Why Choose Us */}
        <section id="why-us" className="py-16 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5">
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Why Choose Us</div>
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-[#0F274A] dark:text-white tracking-tight" style={{ textWrap: 'balance' }}>
                  Engineered for academic scale, regulatory rigor, and everyday reliability
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
                  Built to meet the demands of engineering, management, and architecture institutions across India while respecting GGSIPU academic ordinances and AICTE/COA reporting standards.
                </p>

                <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-2xl lg:text-3xl font-display font-bold text-[#0F274A] dark:text-white tabular-nums">500+</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Institutions</div>
                  </div>
                  <div>
                    <div className="text-2xl lg:text-3xl font-display font-bold text-amber-700 dark:text-amber-400 tabular-nums">24/7</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Campus Support</div>
                  </div>
                  <div>
                    <div className="text-2xl lg:text-3xl font-display font-bold text-[#0F274A] dark:text-white tabular-nums">99.9%</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Verified Uptime</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                  <Smartphone className="w-5 h-5 text-[#0F274A] dark:text-amber-400 mb-4" aria-hidden="true" />
                  <h3 className="text-base font-display font-semibold text-[#0F274A] dark:text-white mb-2">
                    Mobile &amp; Web Responsiveness
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Zero-friction access across lecture-hall tablets, faculty laptops, and parent smartphones with adaptive light and dark themes.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                  <Lock className="w-5 h-5 text-[#0F274A] dark:text-amber-400 mb-4" aria-hidden="true" />
                  <h3 className="text-base font-display font-semibold text-[#0F274A] dark:text-white mb-2">
                    Enterprise Security
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Role-scoped views separate student transcripts, faculty grading sheets, parent advisories, and registrar fee ledgers cleanly.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                  <RefreshCw className="w-5 h-5 text-[#0F274A] dark:text-amber-400 mb-4" aria-hidden="true" />
                  <h3 className="text-base font-display font-semibold text-[#0F274A] dark:text-white mb-2">
                    Continuous Innovation
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Automated GGSIPU SGPA/CGPA calculations, biometric gate reconciliation, and NBA/AICTE outcome analytics updated every semester.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Interactive 3-Phase Launch Roadmap */}
        <section id="roadmap" className="py-16 bg-white dark:bg-slate-900">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div className="max-w-2xl">
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Launch Roadmap</div>
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-[#0F274A] dark:text-white tracking-tight" style={{ textWrap: 'balance' }}>
                  Three structured phases from data migration to full campus go-live
                </h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Select a phase to inspect deployment deliverables
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ROADMAP_PHASES.map((item, idx) => {
                const selected = activePhase === idx;
                return (
                  <button
                    key={item.phase}
                    type="button"
                    onClick={() => setActivePhase(idx)}
                    className={`text-left border rounded-xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      selected
                        ? 'border-[#0F274A] dark:border-amber-500 bg-[#0F274A] dark:bg-slate-800 text-white'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:border-[#0F274A]/40 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className={`flex items-center justify-between text-xs font-mono font-semibold mb-3 ${selected ? 'text-amber-300' : 'text-amber-700 dark:text-amber-400'}`}>
                        <span>{item.phase}</span>
                        <span>{item.timeline}</span>
                      </div>
                      <h3 className={`text-lg font-display font-semibold mb-2 ${selected ? 'text-white' : 'text-[#0F274A] dark:text-white'}`}>
                        {item.title}
                      </h3>
                      <p className={`text-sm leading-relaxed ${selected ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>
                        {item.summary}
                      </p>
                    </div>

                    <ul className={`mt-5 pt-4 border-t space-y-2 text-xs ${selected ? 'border-white/15 text-slate-100' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      {item.deliverables.map((deliv) => (
                        <li key={deliv} className="flex items-start gap-2">
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${selected ? 'text-amber-300' : 'text-emerald-700 dark:text-emerald-400'}`} />
                          <span>{deliv}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="bg-[#09172E] text-slate-300 py-10 border-t border-slate-800">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="text-white font-display font-semibold text-base">
              Delhi Technical Campus · College Management Platform
            </div>
            <div className="text-xs text-slate-400 mt-1">
              28/1, Knowledge Park III, Greater Noida, Uttar Pradesh · Affiliated to GGSIPU · Approved by AICTE &amp; COA
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs">
            <button type="button" onClick={() => onEnterPortal('student')} className="hover:text-white cursor-pointer">
              Student Hub
            </button>
            <button type="button" onClick={() => onEnterPortal('faculty')} className="hover:text-white cursor-pointer">
              Faculty Suite
            </button>
            <button type="button" onClick={() => onEnterPortal('parent')} className="hover:text-white cursor-pointer">
              Parent Portal
            </button>
            <button type="button" onClick={() => onEnterPortal('admin')} className="hover:text-white cursor-pointer">
              Campus Operations
            </button>
          </div>
        </div>
      </footer>

      {/* Interactive Guided Product Tour Modal */}
      {tourOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Platform Guided Tour">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 max-w-2xl w-full overflow-hidden shadow-xl">
            <div className="px-6 py-4 bg-[#0F274A] text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-300 font-medium">Interactive Product Tour</div>
                <h3 className="text-lg font-display font-bold">{currentTourStep.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setTourOpen(false)}
                aria-label="Close tour"
                className="p-1.5 rounded-md hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 overflow-x-auto">
                {TOUR_STEPS.map((step, idx) => (
                  <button
                    key={step.role}
                    type="button"
                    onClick={() => setTourStepIndex(idx)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                      tourStepIndex === idx
                        ? 'bg-[#0F274A] dark:bg-amber-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {step.title}
                  </button>
                ))}
              </div>

              <div>
                <div className="text-sm font-semibold text-amber-700 dark:text-amber-400">{currentTourStep.subtitle}</div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">{currentTourStep.summary}</p>
              </div>

              <ul className="space-y-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
                {currentTourStep.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-800 dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={tourStepIndex === 0}
                    onClick={() => setTourStepIndex((i) => Math.max(0, i - 1))}
                    className="px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={tourStepIndex === TOUR_STEPS.length - 1}
                    onClick={() => setTourStepIndex((i) => Math.min(TOUR_STEPS.length - 1, i + 1))}
                    className="px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    Next Step
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTourOpen(false);
                    onEnterPortal(currentTourStep.role);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors cursor-pointer"
                >
                  <span>Open {currentTourStep.title.replace(/^\d+\.\s*/, '')} Live</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book a Demo Modal */}
      {demoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Book a Campus Demo">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 max-w-md w-full overflow-hidden shadow-xl">
            <div className="px-6 py-4 bg-[#0F274A] text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-300 font-medium">Institutional Onboarding</div>
                <h3 className="text-lg font-display font-bold">Book a Guided Demo</h3>
              </div>
              <button
                type="button"
                onClick={() => setDemoOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-md hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {demoSubmitted ? (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-6 h-6 shrink-0" />
                  <div className="font-display font-semibold text-base text-slate-900 dark:text-white">
                    Demo Consultation Scheduled
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Thank you, <span className="font-semibold text-slate-900 dark:text-white">{demoName}</span>. Our Greater Noida campus onboarding team has logged your walkthrough request for <span className="font-medium text-slate-900 dark:text-white">{demoDept}</span> and sent a calendar invite to <span className="font-mono text-xs">{demoEmail}</span>.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDemoOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoOpen(false);
                      onEnterPortal('admin');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 rounded-lg cursor-pointer"
                  >
                    Explore Admin Portal
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="p-6 space-y-4">
                {demoError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                    {demoError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="demo-name">
                    Full Name
                  </label>
                  <input
                    id="demo-name"
                    type="text"
                    required
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    placeholder="Dr. Sanjay Mishra"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F274A] dark:focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="demo-email">
                    Institutional Email
                  </label>
                  <input
                    id="demo-email"
                    type="email"
                    required
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    placeholder="name@delhitechnicalcampus.ac.in"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F274A] dark:focus:ring-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="demo-role">
                      Role
                    </label>
                    <select
                      id="demo-role"
                      value={demoRole}
                      onChange={(e) => setDemoRole(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    >
                      <option>Director / Dean</option>
                      <option>HOD / Faculty Coordinator</option>
                      <option>Registrar / Operations</option>
                      <option>IT Infrastructure Lead</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="demo-dept">
                      Department
                    </label>
                    <select
                      id="demo-dept"
                      value={demoDept}
                      onChange={(e) => setDemoDept(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    >
                      <option>B.Tech CSE &amp; Allied</option>
                      <option>School of Architecture (COA)</option>
                      <option>Management (MBA/BBA)</option>
                      <option>Full Campus Deployment</option>
                    </select>
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDemoOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={demoSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0F274A] dark:bg-amber-600 hover:bg-[#173766] dark:hover:bg-amber-500 rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    {demoSubmitting ? 'Submitting...' : 'Confirm Demo Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
