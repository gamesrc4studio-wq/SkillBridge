import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Code2,
  Compass,
  FolderGit2,
  Layers,
  Users,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { Avatar } from './Avatar';
import { useApp } from '../context/AppContext';

const SAMPLE_SHOWCASE_PROJECTS = [
  {
    id: 'sample_1',
    title: 'Adaptive Study Copilot',
    category: 'Artificial Intelligence',
    projectType: 'Academic',
    difficulty: 'Intermediate',
    openPositions: 2,
    description:
      'An AI-powered collaborative study platform where computer science students ask technical questions, share annotated code walkthroughs, and track concept mastery.',
    requiredSkills: ['React', 'TypeScript', 'Python', 'AI/ML', 'UI/UX'],
  },
  {
    id: 'sample_2',
    title: 'OpenTelemetry Edge Tracer',
    category: 'Web Development',
    projectType: 'Open Source',
    difficulty: 'Advanced',
    openPositions: 3,
    description:
      'Lightweight distributed tracing dashboard for Node.js and PostgreSQL microservices with zero-overhead trace sampling and team alert channels.',
    requiredSkills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'React'],
  },
  {
    id: 'sample_3',
    title: 'ZeroTrust Campus Vault',
    category: 'Cybersecurity',
    projectType: 'Hackathon',
    difficulty: 'Intermediate',
    openPositions: 2,
    description:
      'End-to-end encrypted credential and environment secret sharing utility tailored for university engineering teams and hackathon squads.',
    requiredSkills: ['TypeScript', 'Node.js', 'Firebase', 'Tailwind CSS'],
  },
];

export const LandingPage: React.FC = () => {
  const { authUser, setActiveView, navigateOrLogin, clearAuthError } = useApp();
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [blueprintFilter, setBlueprintFilter] = useState<'All' | 'Artificial Intelligence' | 'Web Development' | 'Cybersecurity'>('All');

  const filteredShowcase = useMemo(() => {
    if (blueprintFilter === 'All') return SAMPLE_SHOWCASE_PROJECTS;
    return SAMPLE_SHOWCASE_PROJECTS.filter((p) => p.category === blueprintFilter);
  }, [blueprintFilter]);

  const openLogin = () => {
    clearAuthError();
    if (authUser) {
      setActiveView('overview');
    } else {
      setActiveView('login');
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1F2328] flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#D1D9E0]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a href="#top" className="shrink-0">
            <BrandLogo size="md" />
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#656D76]">
            <a href="#top" className="hover:text-[#1F2328] hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              Home
            </a>
            <button
              type="button"
              onClick={() => navigateOrLogin('explore-projects')}
              className="hover:text-[#1F2328] hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Explore Projects
            </button>
            <button
              type="button"
              onClick={() => navigateOrLogin('find-developers')}
              className="hover:text-[#1F2328] hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Find Developers
            </button>
            <a href="#how-it-works" className="hover:text-[#1F2328] hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              How It Works
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {!authUser && (
              <button
                type="button"
                onClick={openLogin}
                className="px-3.5 py-2 text-sm font-medium text-[#1F2328] hover:text-[#0969DA] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Login
              </button>
            )}
            <button
              type="button"
              onClick={openLogin}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {authUser ? 'Open Dashboard' : 'Get Started'}
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Section */}
        <section className="relative border-b border-[#D1D9E0] bg-white overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-blueprint-grid [mask-image:radial-gradient(ellipse_at_top_right,rgba(0,0,0,0.45),transparent_70%)]"
          />
          <div className="relative max-w-7xl mx-auto px-6 py-14 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center">
                <p className="text-xs font-semibold text-[#0969DA] tracking-wide mb-3">
                  SkillBridge · Hackathons · Capstones · Startup Builds
                </p>
                <h1 className="text-[clamp(2.25rem,4vw,3.6rem)] font-bold tracking-tight leading-[1.08] text-[#1F2328] text-balance">
                  Great Ideas Need the Right Team.
                </h1>
                <p className="mt-5 text-base lg:text-lg text-[#656D76] leading-relaxed max-w-xl">
                  Stop hunting for co-builders in dead group chats. Match with developers by verified skills, turn raw ideas into AI roadmaps, and ship together in one workspace.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={openLogin}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0969DA] hover:bg-[#0550AE] rounded-lg transition-all duration-150 active:scale-[0.99] whitespace-nowrap shrink-0"
                  >
                    Start Building
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateOrLogin('explore-projects')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#1F2328] bg-[#F6F8FA] hover:bg-[#EAEFF4] border border-[#D1D9E0] rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <Compass className="w-4 h-4 text-[#0969DA]" />
                    Explore Projects
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#656D76]">
                  <button
                    type="button"
                    onClick={openLogin}
                    className="font-semibold text-[#0969DA] hover:underline whitespace-nowrap"
                  >
                    {authUser ? 'Open Your Workspace' : 'Continue with Google or Email'}
                  </button>
                  <span aria-hidden="true">·</span>
                  <span>Gemini Idea Specs</span>
                  <span aria-hidden="true">·</span>
                  <span>Real-Time Kanban Squads</span>
                </div>
              </div>

              <div className="lg:col-span-6 flex">
                <div className="w-full rounded-lg border border-[#D1D9E0] overflow-hidden bg-[#F6F8FA] min-h-[280px]">
                  {!heroImgFailed ? (
                    <img
                      src="/src/assets/images/hero_workspace_1795019046575.jpg"
                      alt="Developers collaborating at a studio table with laptops and architectural notebooks"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="w-full h-full object-cover lg:min-h-[380px]"
                    />
                  ) : (
                    <div className="w-full h-full min-h-[340px] flex flex-col items-center justify-center p-8 text-center bg-[#F6F8FA]">
                      <FolderGit2 className="w-10 h-10 text-[#0969DA] mb-3" />
                      <p className="text-sm font-semibold text-[#1F2328]">SkillBridge Collaborative Workspace</p>
                      <p className="text-xs text-[#656D76] mt-1">AI Project Planning · Deterministic Matching · Kanban Teams</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Platform Architecture Capabilities Strip */}
            <div className="mt-12 pt-8 border-t border-[#D1D9E0]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-[#656D76]">
                  Platform Capabilities · Built for Cross-Functional Developer Teams
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border border-[#D1D9E0] bg-[#F6F8FA]">
                  <p className="text-2xl font-bold text-[#1F2328] tabular-nums">8 Domains</p>
                  <p className="text-xs text-[#656D76] mt-1">Web, AI/ML, Mobile, Security &amp; More</p>
                </div>
                <div className="p-4 rounded-lg border border-[#D1D9E0] bg-[#F6F8FA]">
                  <p className="text-2xl font-bold text-[#0969DA] tabular-nums">5-Factor</p>
                  <p className="text-xs text-[#656D76] mt-1">Deterministic Skill Scoring</p>
                </div>
                <div className="p-4 rounded-lg border border-[#D1D9E0] bg-[#F6F8FA]">
                  <p className="text-2xl font-bold text-[#1A7F37] tabular-nums">Gemini AI</p>
                  <p className="text-xs text-[#656D76] mt-1">Server-Side Idea &amp; Plan Engine</p>
                </div>
                <div className="p-4 rounded-lg border border-[#D1D9E0] bg-[#F6F8FA]">
                  <p className="text-2xl font-bold text-[#1F2328] tabular-nums">Real-Time</p>
                  <p className="text-xs text-[#656D76] mt-1">Firestore Tasks &amp; Team Channels</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How SkillBridge Works */}
        <section id="how-it-works" className="bg-[#F6F8FA] border-b border-[#D1D9E0]">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#0969DA]">Workflow</p>
              <h2 className="mt-1 text-2xl lg:text-3xl font-bold tracking-tight text-[#1F2328]">
                How SkillBridge turns a raw idea into a shipping team
              </h2>
              <p className="mt-2 text-sm text-[#656D76] leading-relaxed">
                Replace scattered chat messages and guesswork with structured architectural planning, transparent skill matching, and shared execution boards.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01. Analyze Your Idea',
                  title: 'Gemini AI Project Analyzer',
                  body: 'Describe your concept in plain language. Server-side Gemini generates roles, required skills, roadmap phases, and initial tasks.',
                },
                {
                  step: '02. Match Verified Skills',
                  title: 'Weighted Skill Scoring',
                  body: 'Compare project requirements against developer profiles using skill overlap, proficiency level, experience, and availability.',
                },
                {
                  step: '03. Form Balanced Teams',
                  title: 'Set-Cover Team Builder',
                  body: 'Our deterministic algorithm selects complementary teammates that maximize missing skill coverage without redundant overlap.',
                },
                {
                  step: '04. Collaborate & Ship',
                  title: 'Shared Team Workspace',
                  body: 'Manage Kanban tasks, milestones, announcements, shared engineering notes, and channel discussions in one place.',
                },
              ].map((item) => (
                <div key={item.step} className="bg-white border border-[#D1D9E0] rounded-lg p-5">
                  <p className="text-xs font-semibold text-[#0969DA]">{item.step}</p>
                  <h3 className="mt-2 text-base font-semibold text-[#1F2328]">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#656D76] leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Features & Sample Project Previews */}
        <section className="bg-white border-b border-[#D1D9E0]">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5">
                <p className="text-xs font-semibold text-[#9A6700] mb-2">
                  AI &amp; Deterministic Engineering
                </p>
                <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#1F2328] text-balance">
                  Built for transparency, not black-box scores
                </h2>
                <p className="mt-3 text-sm text-[#656D76] leading-relaxed">
                  SkillBridge pairs generative AI planning with deterministic matching math. Every match percentage breaks down into exact skill overlap, proficiency weights, experience fit, and availability.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Bot className="w-5 h-5 text-[#0969DA] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-[#1F2328]">12-Section AI Blueprints</h3>
                      <p className="text-xs text-[#656D76] mt-0.5">
                        One click converts an AI analysis directly into a live recruiting project with pre-filled skills and milestones.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Layers className="w-5 h-5 text-[#0969DA] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-[#1F2328]">Zero Redundant Recommendations</h3>
                      <p className="text-xs text-[#656D76] mt-0.5">
                        Team Builder prioritizes candidates who close uncovered skill gaps first, calculating real-time team skill coverage.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Code2 className="w-5 h-5 text-[#0969DA] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-[#1F2328]">Real-Time Team Workspaces</h3>
                      <p className="text-xs text-[#656D76] mt-0.5">
                        Kanban task columns, project channels, announcements, and milestones synchronized with Firestore.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => navigateOrLogin('ai-analyzer')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0969DA] bg-[#F6F8FA] hover:bg-[#EAEFF4] border border-[#D1D9E0] rounded-lg transition-colors"
                  >
                    Open AI Project Analyzer
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sample Project Format Showcase */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1 p-1 bg-[#F6F8FA] border border-[#D1D9E0] rounded-lg">
                    {(
                      [
                        { id: 'All', label: 'All' },
                        { id: 'Artificial Intelligence', label: 'AI & ML' },
                        { id: 'Web Development', label: 'Web' },
                        { id: 'Cybersecurity', label: 'Security' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setBlueprintFilter(tab.id)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                          blueprintFilter === tab.id
                            ? 'bg-white text-[#1F2328] border border-[#D1D9E0]'
                            : 'text-[#656D76] hover:text-[#1F2328]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateOrLogin('explore-projects')}
                    className="text-xs font-semibold text-[#0969DA] hover:underline whitespace-nowrap"
                  >
                    Browse live projects
                  </button>
                </div>
                {filteredShowcase.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-5 rounded-xl border border-[#D1D9E0] bg-white hover:border-[#0969DA] transition-all duration-150"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#656D76]">
                          <span>{proj.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{proj.projectType}</span>
                          <span aria-hidden="true">·</span>
                          <span>{proj.difficulty}</span>
                        </div>
                        <h4 className="mt-1 text-base font-semibold text-[#1F2328]">{proj.title}</h4>
                      </div>
                      <span className="text-xs font-semibold text-[#1A7F37] whitespace-nowrap shrink-0 tabular-nums">
                        {proj.openPositions} open {proj.openPositions === 1 ? 'role' : 'roles'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#656D76] line-clamp-2">{proj.description}</p>
                    <div className="mt-3 pt-3 border-t border-[#D1D9E0] flex flex-wrap items-center justify-between gap-2 text-xs text-[#656D76]">
                      <span>Skills: {proj.requiredSkills.join(' · ')}</span>
                      <button
                        type="button"
                        onClick={() => navigateOrLogin('explore-projects')}
                        className="font-semibold text-[#0969DA] hover:underline whitespace-nowrap"
                      >
                        {authUser ? 'Explore Projects →' : 'Sign in to Explore →'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Developer Community & Sample Testimonials */}
        <section className="bg-[#F6F8FA] border-b border-[#D1D9E0]">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-medium text-[#656D76]">Sample Community Feedback</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1F2328]">
                  How student builders &amp; engineers use SkillBridge
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigateOrLogin('find-developers')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0969DA] hover:underline whitespace-nowrap"
              >
                <Users className="w-4 h-4" />
                Browse Developer Directory
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Elena Rostova',
                  role: 'CS Senior, University of Washington (Sample)',
                  avatar: '/src/assets/images/avatar_dev_elena_1795019045410.jpg',
                  quote:
                    'Before SkillBridge, recruiting for capstone projects meant posting in three Slack channels with no idea who knew Python or UI design. Team Builder matched us to 100% skill coverage in one session.',
                },
                {
                  name: 'Marcus Vance',
                  role: 'Systems Engineer, Georgia Tech (Sample)',
                  avatar: '/src/assets/images/avatar_dev_marcus_1795019046552.jpg',
                  quote:
                    'Seeing the exact skill overlap and proficiency breakdown removed all guesswork when inviting contributors. We moved from idea to a working telemetry prototype in four weeks.',
                },
                {
                  name: 'Mei Lin Chen',
                  role: 'Interaction Designer, RISD (Sample)',
                  avatar: '/src/assets/images/avatar_dev_mei_1795019047094.jpg',
                  quote:
                    'Having AI-generated milestones flow straight into a shared Kanban board and design discussion channel kept our cross-discipline team aligned every sprint.',
                },
              ].map((t) => (
                <div key={t.name} className="bg-white border border-[#D1D9E0] rounded-lg p-6 flex flex-col justify-between">
                  <p className="text-sm text-[#1F2328] leading-relaxed">“{t.quote}”</p>
                  <div className="mt-5 pt-4 border-t border-[#D1D9E0] flex items-center gap-3">
                    <Avatar name={t.name} src={t.avatar} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1F2328] truncate">{t.name}</p>
                      <p className="text-xs text-[#656D76] truncate">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-6 py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-[#1F2328]">
                Ready to assemble your next project team?
              </h2>
              <p className="mt-1 text-sm text-[#656D76]">
                Sign in with Google or email to build your developer profile, publish projects, and launch team workspaces.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={openLogin}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {authUser ? 'Open Dashboard' : 'Go to Login Page'}
              </button>
              <button
                type="button"
                onClick={() => navigateOrLogin('explore-projects')}
                className="px-5 py-2.5 text-sm font-medium text-[#1F2328] bg-[#F6F8FA] hover:bg-[#EAEFF4] border border-[#D1D9E0] rounded-lg transition-colors"
              >
                Explore Projects
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#F6F8FA] border-t border-[#D1D9E0]">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#656D76]">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span>·</span>
            <span>Find Your Skills. Build Your Team. Build Something Amazing.</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button type="button" onClick={() => navigateOrLogin('explore-projects')} className="hover:text-[#1F2328]">
              Explore Projects
            </button>
            <button type="button" onClick={() => navigateOrLogin('find-developers')} className="hover:text-[#1F2328]">
              Find Developers
            </button>
            <button type="button" onClick={() => navigateOrLogin('ai-analyzer')} className="hover:text-[#1F2328]">
              AI Analyzer
            </button>
            <button type="button" onClick={openLogin} className="hover:text-[#1F2328]">
              {authUser ? 'Dashboard' : 'Login'}
            </button>
            <span>contact@skillbridge.dev</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
