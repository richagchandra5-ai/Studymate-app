import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  Menu,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface LandingPageProps {
  currentUser: User | null;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onOpenDashboard: () => void;
}

type PreviewDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';

interface PreviewBlock {
  id: string;
  time: string;
  duration: string;
  subject: string;
  topic: string;
  type: string;
}

const PREVIEW_SCHEDULE: Record<PreviewDay, PreviewBlock[]> = {
  Mon: [
    {
      id: 'm1',
      time: '17:00',
      duration: '60m',
      subject: 'Managerial Economics',
      topic: 'Demand Elasticity & Forecasting Cases',
      type: 'Core Study',
    },
    {
      id: 'm2',
      time: '18:30',
      duration: '45m',
      subject: 'Corporate Finance',
      topic: 'Capital Budgeting — NPV & IRR Practice',
      type: 'Assignment',
    },
    {
      id: 'm3',
      time: '20:00',
      duration: '30m',
      subject: 'Quantitative Methods',
      topic: 'Day 3 Spaced Revision: Regression',
      type: 'Revision',
    },
  ],
  Tue: [
    {
      id: 't1',
      time: '17:30',
      duration: '60m',
      subject: 'Corporate Finance',
      topic: 'Cost of Capital & WACC Numericals',
      type: 'Core Study',
    },
    {
      id: 't2',
      time: '19:00',
      duration: '45m',
      subject: 'Strategic Management',
      topic: 'Porter Five Forces Case Brief',
      type: 'Assignment',
    },
  ],
  Wed: [
    {
      id: 'w1',
      time: '17:00',
      duration: '60m',
      subject: 'Quantitative Methods',
      topic: 'Hypothesis Testing & Chi-Square',
      type: 'Core Study',
    },
    {
      id: 'w2',
      time: '18:30',
      duration: '45m',
      subject: 'Managerial Economics',
      topic: 'Day 7 Exam Revision: Cost Curves',
      type: 'Exam Prep',
    },
  ],
  Thu: [
    {
      id: 'th1',
      time: '17:00',
      duration: '60m',
      subject: 'Strategic Management',
      topic: 'Competitive Advantage Frameworks',
      type: 'Core Study',
    },
    {
      id: 'th2',
      time: '18:30',
      duration: '45m',
      subject: 'Corporate Finance',
      topic: 'Working Capital Ratios Review',
      type: 'Revision',
    },
  ],
  Fri: [
    {
      id: 'f1',
      time: '16:30',
      duration: '90m',
      subject: 'Weekly Mock Review',
      topic: 'Mixed Problem Set Across 4 Subjects',
      type: 'Exam Prep',
    },
    {
      id: 'f2',
      time: '18:30',
      duration: '30m',
      subject: 'Weekly Syllabus Audit',
      topic: 'Update Topic Mastery & Next Week Slots',
      type: 'Planning',
    },
  ],
};

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onOpenAuth,
  onOpenDashboard,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [previewDay, setPreviewDay] = useState<PreviewDay>('Mon');
  const [checkedBlocks, setCheckedBlocks] = useState<Record<string, boolean>>({
    m1: true,
  });

  const togglePreviewBlock = (id: string) => {
    setCheckedBlocks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrimaryCta = () => {
    if (currentUser) {
      onOpenDashboard();
    } else {
      onOpenAuth('signup');
    }
  };

  const activeBlocks = PREVIEW_SCHEDULE[previewDay];
  const completedCount = activeBlocks.filter((b) => checkedBlocks[b.id]).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            StudyMate
          </a>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#features"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#comparison"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Why StudyMate
            </a>
            <a
              href="#pricing"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Pricing
            </a>
            <a
              href="#pilot"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Campus Pilot
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => (currentUser ? onOpenDashboard() : onOpenAuth('signin'))}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {currentUser ? 'Open Dashboard' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile navigation drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-2">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Features
            </a>
            <a
              href="#comparison"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Why StudyMate
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Pricing
            </a>
            <a
              href="#pilot"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Campus Pilot
            </a>
          </div>
        )}
      </header>

      <main id="top" className="flex-1">
        {/* Hero Section */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              {/* Left Proposition */}
              <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
                <p className="text-xs font-medium text-slate-500 tracking-wide">
                  Dehradun Campus Edition · Built for University & College Students
                </p>
                <h1 className="font-display text-[clamp(2.15rem,4vw,3.35rem)] font-bold leading-[1.12] tracking-tight text-slate-900 text-balance">
                  Organize your study timetable, subjects, and exam revision in one place.
                </h1>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  Replace scattered notebooks, generic calendars, and missed deadlines. StudyMate
                  helps you plan daily study blocks, track syllabus mastery across every paper,
                  and stick to consistent revision cycles.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={handlePrimaryCta}
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {currentUser ? 'Go to My Workspace' : 'Start Planning Free'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href="#pricing"
                    className="px-4 py-3 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    Compare Free & ₹49/mo Plan
                  </a>
                </div>
                <p className="text-xs text-slate-500">
                  Free basic planner for up to 4 subjects · No setup templates required
                </p>
              </div>

              {/* Right Interactive Study Timetable Preview */}
              <div className="lg:col-span-6 flex flex-col">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <div>
                      <h2 className="font-display text-base font-semibold text-slate-900">
                        Interactive Weekly Study Planner
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        {completedCount} of {activeBlocks.length} blocks checked for {previewDay}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
                      {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as PreviewDay[]).map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setPreviewDay(day)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                            previewDay === day
                              ? 'bg-blue-700 text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {activeBlocks.map((block) => {
                      const done = Boolean(checkedBlocks[block.id]);
                      return (
                        <button
                          key={block.id}
                          type="button"
                          onClick={() => togglePreviewBlock(block.id)}
                          className={`w-full text-left p-3.5 rounded-lg border transition-colors flex items-start justify-between gap-4 ${
                            done
                              ? 'bg-emerald-50/60 border-emerald-200'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <span
                              className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                done
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'bg-white border-slate-300 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="font-medium text-slate-700">{block.subject}</span>
                                <span aria-hidden="true">·</span>
                                <span>{block.type}</span>
                              </div>
                              <p
                                className={`text-sm font-medium mt-0.5 ${
                                  done ? 'line-through text-slate-500' : 'text-slate-900'
                                }`}
                              >
                                {block.topic}
                              </p>
                            </div>
                          </div>
                          <div className="text-right font-mono text-xs tabular-nums text-slate-600 shrink-0">
                            <div className="font-medium text-slate-900">{block.time}</div>
                            <div className="text-slate-500">{block.duration}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                    <span>Click any block above to test task completion</span>
                    <button
                      type="button"
                      onClick={handlePrimaryCta}
                      className="font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0"
                    >
                      Customize your own schedule →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-width 4-column KPI Strip below Hero Split */}
            <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                  ₹0 / mo
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Free basic timetable & task planner
                </div>
              </div>
              <div>
                <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                  ₹49 / mo
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Student Plus (₹588/yr) for unlimited papers
                </div>
              </div>
              <div>
                <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                  1–3–7 Days
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Structured spaced revision checkpoints
                </div>
              </div>
              <div>
                <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                  18–25 yrs
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Designed for UG & PG students in Dehradun
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Capabilities Bento Grid */}
        <section id="features" className="py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
            <div className="max-w-2xl space-y-3">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
                Everything students need for regular classes and exam season.
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Built around real student workflows—no bloated team boards or complicated template
                configuration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 01 - Wide span */}
              <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-display text-xl font-semibold text-slate-900">
                      01. Personalized Study Timetable
                    </h3>
                    <CalendarDays className="w-5 h-5 text-blue-700 shrink-0" />
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                    Map study, revision, and assignment blocks across Monday through Sunday around
                    your lecture hours. Check off today&apos;s blocks with one click and keep a steady
                    daily routine without juggling paper diaries and reminder apps.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <div>
                    <div className="font-semibold text-slate-900">Day-by-Day Focus</div>
                    <div className="mt-0.5">Auto-highlights today&apos;s blocks</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Block Categories</div>
                    <div className="mt-0.5">Study, Revision, Exam Prep</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Zero Clutter</div>
                    <div className="mt-0.5">Time & duration aligned cleanly</div>
                  </div>
                </div>
              </div>

              {/* Feature 02 */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-display text-xl font-semibold text-slate-900">
                      02. Subject & Syllabus Mastery
                    </h3>
                    <BookOpen className="w-5 h-5 text-blue-700 shrink-0" />
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Keep every paper organized with exam date countdowns, unit completion bars,
                    priority tags, and concise revision notes in one view.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-slate-700 font-sans font-medium">Syllabus Completed</span>
                    <span className="text-slate-900 font-semibold">7 / 12 units</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-700 w-[58%]" />
                  </div>
                </div>
              </div>

              {/* Feature 03 */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-display text-xl font-semibold text-slate-900">
                      03. Spaced Revision & Deadlines
                    </h3>
                    <Layers className="w-5 h-5 text-blue-700 shrink-0" />
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Track assignments and step through Day 1, Day 3, and Day 7 revision checkpoints
                    so important topics stay fresh before finals.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Revision Stages</span>
                  <span className="font-mono font-medium text-slate-900 tabular-nums">
                    Stage 1 → 2 → 3
                  </span>
                </div>
              </div>

              {/* Feature 04 - Wide span */}
              <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-display text-xl font-semibold text-slate-900">
                      04. Focus Timer & 7-Day Study Progress
                    </h3>
                    <Clock className="w-5 h-5 text-blue-700 shrink-0" />
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                    Start a 25-minute Pomodoro, 50-minute Deep Work, or 15-minute Quick Review
                    session linked directly to a subject. Every finished session updates your daily
                    study target and 7-day consistency chart.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <div>
                    <div className="font-mono font-semibold text-slate-900">25m / 50m</div>
                    <div className="mt-0.5">Presets + custom duration</div>
                  </div>
                  <div>
                    <div className="font-mono font-semibold text-slate-900">Auto-Logged</div>
                    <div className="mt-0.5">Saved to subject history</div>
                  </div>
                  <div>
                    <div className="font-mono font-semibold text-slate-900">Daily Target</div>
                    <div className="mt-0.5">Tracks minutes vs daily goal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Positioning Comparison Matrix */}
        <section id="comparison" className="py-16 bg-white border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
                Purpose-built for students, not adapted from corporate tools.
              </h2>
              <p className="text-base text-slate-600">
                How StudyMate compares against common student workarounds.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
                    <th className="py-3.5 px-4">Capability</th>
                    <th className="py-3.5 px-4">General Calendars</th>
                    <th className="py-3.5 px-4">Generic Note Suites</th>
                    <th className="py-3.5 px-4 bg-blue-50/70 text-blue-900">StudyMate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  <tr>
                    <td className="py-3.5 px-4 font-medium text-slate-900">Setup Time</td>
                    <td className="py-3.5 px-4 text-slate-600">Fast, but lacks syllabus links</td>
                    <td className="py-3.5 px-4 text-slate-600">Manual template building</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 bg-blue-50/30">
                      Ready in under 60 seconds
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      Syllabus & Exam Countdowns
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">Not supported</td>
                    <td className="py-3.5 px-4 text-slate-600">Requires custom formulas</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 bg-blue-50/30">
                      Built-in unit progress & countdowns
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      Spaced Revision Checkpoints
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">Manual recurring events</td>
                    <td className="py-3.5 px-4 text-slate-600">Not built-in</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 bg-blue-50/30">
                      Day 1 · Day 3 · Day 7 stage tracker
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      Student-Friendly Pricing
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono tabular-nums">Free</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono tabular-nums">
                      Free / Paid tiers
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-blue-800 bg-blue-50/30 font-mono tabular-nums">
                      Free · Plus ₹49 / month
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Proof + Pricing Section */}
        <section id="pricing" className="py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
            {/* Student Validation Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  &ldquo;Before exams I used three different apps—one for lecture notes, one for
                  assignment reminders, and paper sticky notes for revision. Having subjects,
                  timetable blocks, and unit progress in one clean view saved hours every week.&rdquo;
                </p>
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">Aarav Rawat</span>
                  <span aria-hidden="true"> · </span>
                  <span>MBA Cohort, DBS Global University, Dehradun</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  &ldquo;Most productivity tools take an entire weekend to configure or cost more
                  than a student budget allows. A focused study planner with a free tier and a ₹49
                  monthly upgrade makes real sense during semester finals.&rdquo;
                </p>
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">Ananya Negi</span>
                  <span aria-hidden="true"> · </span>
                  <span>B.Tech CSE (3rd Year), Dehradun</span>
                </div>
              </div>
            </div>

            {/* Pricing Matrix */}
            <div className="space-y-8">
              <div className="max-w-2xl space-y-2">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
                  Simple, transparent student pricing.
                </h2>
                <p className="text-base text-slate-600">
                  Start free with core timetable and task tools. Upgrade to Student Plus anytime for
                  ₹49/month.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* Free Plan */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">For everyday semester planning</p>
                      <h3 className="font-display text-xl font-bold text-slate-900 mt-1">
                        Basic Free
                      </h3>
                    </div>
                    <div className="flex items-baseline gap-2 font-mono tabular-nums">
                      <span className="text-3xl font-bold text-slate-900">₹0</span>
                      <span className="text-sm text-slate-500">/ month forever</span>
                    </div>
                    <ul className="space-y-2.5 pt-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Up to 4 active subjects & syllabus trackers</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Weekly Monday–Sunday study timetable</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Assignment & exam deadline tracking</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Focus timer & 7-day study minutes chart</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={handlePrimaryCta}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {currentUser ? 'Open Free Workspace' : 'Start Free Account'}
                  </button>
                </div>

                {/* Student Plus Plan */}
                <div className="bg-white border-2 border-blue-700 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-blue-700">
                        For heavy semesters & competitive exams
                      </p>
                      <h3 className="font-display text-xl font-bold text-slate-900 mt-1">
                        Student Plus
                      </h3>
                    </div>
                    <div className="flex items-baseline gap-2 font-mono tabular-nums">
                      <span className="text-3xl font-bold text-slate-900">₹49</span>
                      <span className="text-sm text-slate-500">/ month · ₹588 billed annually</span>
                    </div>
                    <ul className="space-y-2.5 pt-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                        <span>Unlimited subjects, electives & exam papers</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                        <span>1–3–7 day spaced revision cycle workflows</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                        <span>Weekly study summary CSV export</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                        <span>Early access to Dehradun campus pilot perks</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={handlePrimaryCta}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {currentUser ? 'Manage Plan in Dashboard' : 'Try StudyMate Plus'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Campus Pilot Banner */}
        <section id="pilot" className="py-14 bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                Join the Dehradun Student Pilot Cohort
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                We are piloting StudyMate across college campuses in Dehradun, Uttarakhand. Sign in
                to organize your semester and share direct feedback on the features you need most.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {currentUser ? 'Open My Workspace' : 'Join Campus Pilot'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-sm text-slate-900">StudyMate</span>
            <span aria-hidden="true">·</span>
            <span>Dehradun, Uttarakhand · Student Study Planning Platform</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#comparison" className="hover:text-slate-900 transition-colors">
              Comparison
            </a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">
              Pricing
            </a>
            <span>© {new Date().getFullYear()} StudyMate</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
