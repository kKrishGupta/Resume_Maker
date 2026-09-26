import React, { useState, useEffect } from 'react';
import '../style/interview.scss';
import { useInterview } from '../hooks/useInterview.js';
import { useNavigate, useParams } from 'react-router-dom';
import { generateMoreQuestions, generateMoreBehavioral, generateFollowUp, updateRoadmap } from "../services/interview.api";
import Navbar from '../components/Navbar.jsx';

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
    { id: 'analysis', label: 'Match & Skills', mobileOnly: true, icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>) },
];

// ── Question Card Component ──────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [open, setOpen] = useState(false);
    const [followUps, setFollowUps] = useState([]);
    const [loadingFollow, setLoadingFollow] = useState(false);

    const handleFollowUp = async (e) => {
        e.stopPropagation();
        try {
            setLoadingFollow(true);
            const data = await generateFollowUp({
                question: item.question,
                answer: item.answer
            });

            if (data?.followUps) {
                setFollowUps(data.followUps);
                setOpen(true);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to generate follow-up questions");
        } finally {
            setLoadingFollow(false);
        }
    };

    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <button
                    type="button"
                    className="follow-btn"
                    onClick={handleFollowUp}
                    title="Generate follow-up questions"
                >
                    {loadingFollow ? "Thinking..." : "💬 Follow-up"}
                </button>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Interviewer's Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Strong Model Answer</span>
                        <p>{item.answer}</p>
                    </div>

                    {followUps.length > 0 && (
                        <div className="followups">
                            <p className="followups-title">Potential Follow-Up Probes</p>
                            {followUps.map((f, i) => (
                                <div key={i} className="followup-card">
                                    <p className="followup-question">👉 {f.question}</p>
                                    <div className="followup-section">
                                        <span className="tag intention">Intention</span>
                                        <p>{f.intention}</p>
                                    </div>
                                    <div className="followup-section">
                                        <span className="tag answer">Model Answer</span>
                                        <p>{f.answer}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ── RoadMap Day Component ────────────────────────────────────────────────────
const RoadMapDay = ({ day, onUpdateDay }) => {
    const [tasks, setTasks] = useState(day.tasks || []);
    const [newTask, setNewTask] = useState("");
    const [editingIndex, setEditingIndex] = useState(null);
    const [editText, setEditText] = useState("");

    const handleAddTask = () => {
        if (!newTask.trim()) return;
        const updated = [...tasks, { text: newTask.trim(), done: false }];
        setTasks(updated);
        setNewTask("");
        onUpdateDay(day.day, updated);
    };

    const handleDelete = (index) => {
        const updated = tasks.filter((_, i) => i !== index);
        setTasks(updated);
        onUpdateDay(day.day, updated);
    };

    const handleToggle = (index) => {
        const updated = [...tasks];
        updated[index].done = !updated[index].done;
        setTasks(updated);
        onUpdateDay(day.day, updated);
    };

    const handleEditSave = (index) => {
        if (!editText.trim()) return;
        const updated = [...tasks];
        updated[index].text = editText.trim();
        setTasks(updated);
        setEditingIndex(null);
        setEditText("");
        onUpdateDay(day.day, updated);
    };

    return (
        <div className="roadmap-day">
            <div className="roadmap-day__header">
                <span className="roadmap-day__badge">Day {day.day}</span>
                <p className="roadmap-day__focus">{day.focus}</p>
            </div>

            <ul className="roadmap-day__tasks">
                {tasks.map((task, i) => (
                    <li key={i} className={task.done ? "done" : ""}>
                        <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => handleToggle(i)}
                            className="task-checkbox"
                        />

                        {editingIndex === i ? (
                            <div className="edit-task-row">
                                <input
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave(i)}
                                />
                                <button onClick={() => handleEditSave(i)}>Save</button>
                                <button onClick={() => setEditingIndex(null)}>Cancel</button>
                            </div>
                        ) : (
                            <span className="task-text" onClick={() => handleToggle(i)}>{task.text}</span>
                        )}

                        <div className="task-actions">
                            {editingIndex !== i && (
                                <button title="Edit" onClick={() => { setEditingIndex(i); setEditText(task.text); }}>✏️</button>
                            )}
                            <button title="Delete" onClick={() => handleDelete(i)}>🗑</button>
                        </div>
                    </li>
                ))}
            </ul>

            <div className="add-task">
                <input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add step or revision topic..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                />
                <button type="button" onClick={handleAddTask}>+ Add</button>
            </div>
        </div>
    );
};

// ── Reusable Analysis Panel Component ────────────────────────────────────────
const AnalysisPanel = ({ report, openSection, setOpenSection }) => {
    if (!report) return null;
    const score = report.matchScore ?? 0;
    const scoreColor = score >= 80 ? 'score--high' : score >= 60 ? 'score--mid' : 'score--low';
    const scoreLabel = score >= 80 ? 'Strong Match' : score >= 60 ? 'Good Match' : 'Optimization Recommended';

    return (
        <div className='analysis-panel'>
            {/* Match Score Card */}
            <div className='match-score-card'>
                <p className='match-score-card__label'>Target Role Alignment</p>
                <div className={`match-score-ring ${scoreColor}`}>
                    <span className='match-score-val'>{score}</span>
                    <span className='match-score-unit'>%</span>
                </div>
                <span className={`match-score-badge ${scoreColor}`}>{scoreLabel}</span>
            </div>

            {/* Missing Keywords */}
            <div className="analysis-card">
                <div
                    className="analysis-card__header"
                    onClick={() => setOpenSection(prev => (prev === "keywords" ? null : "keywords"))}
                >
                    <span className="card-title">
                        <span className="icon">🎯</span> Missing Keywords
                    </span>
                    <span className="pill-badge">{report?.missingKeywords?.length || 0}</span>
                </div>

                {(openSection === "keywords" || openSection === null) && (
                    <div className="analysis-card__body">
                        {report?.missingKeywords?.length > 0 ? (
                            <div className="analysis-tags-wrap">
                                {report.missingKeywords.map((item, i) => (
                                    <span key={i} className="keyword-tag">{item}</span>
                                ))}
                            </div>
                        ) : (
                            <p className="analysis-empty">No critical missing keywords</p>
                        )}
                    </div>
                )}
            </div>

            {/* Weak Projects */}
            <div className="analysis-card">
                <div className="analysis-card__header no-click">
                    <span className="card-title">
                        <span className="icon">⚠️</span> Project Critique
                    </span>
                </div>
                <div className="analysis-card__body">
                    {report?.weakProjects?.length > 0 ? (
                        report.weakProjects.map((item, i) => (
                            <p key={i} className="analysis-text warning">• {item}</p>
                        ))
                    ) : (
                        <p className="analysis-empty">Projects well-aligned with requirements</p>
                    )}
                </div>
            </div>

            {/* Key Improvements */}
            {report?.improvements?.length > 0 && (
                <div className="analysis-card">
                    <div className="analysis-card__header no-click">
                        <span className="card-title">
                            <span className="icon">💡</span> Strategic Improvements
                        </span>
                    </div>
                    <div className="analysis-card__body">
                        {report.improvements.map((item, i) => (
                            <p key={i} className="analysis-text">• {item}</p>
                        ))}
                    </div>
                </div>
            )}

            {/* Resume Boost Lines */}
            {report?.suggestedBulletPoints?.length > 0 && (
                <div className="analysis-card">
                    <div className="analysis-card__header no-click">
                        <span className="card-title">
                            <span className="icon">✨</span> Resume Bullet Points
                        </span>
                    </div>
                    <div className="analysis-card__body">
                        {report.suggestedBulletPoints.map((item, i) => (
                            <div key={i} className="boost-bullet">
                                <span className="sparkle">✦</span>
                                <p>{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skill Gaps */}
            {report?.skillGaps?.length > 0 && (
                <div className="analysis-card">
                    <div className="analysis-card__header no-click">
                        <span className="card-title">
                            <span className="icon">📊</span> Skill Gap Priorities
                        </span>
                    </div>
                    <div className="analysis-card__body">
                        <div className='skill-gaps-list'>
                            {report.skillGaps.map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity || 'low'}`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Main Interview Component ─────────────────────────────────────────────────
const Interview = () => {
    const [activeNav, setActiveNav] = useState('technical');
    const { report, getReportById, loading } = useInterview();
    const [generating, setGenerating] = useState(false);
    const [questions, setQuestions] = useState([]);
    const { interviewId } = useParams();
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [behavioralQuestions, setBehavioralQuestions] = useState([]);
    const [generatingBehavioral, setGeneratingBehavioral] = useState(false);
    const [openSection, setOpenSection] = useState(null);
    const navigate = useNavigate();

    const handleGenerateMore = async () => {
        try {
            setGenerating(true);
            const data = await generateMoreQuestions(interviewId);
            if (data?.questions) {
                setQuestions(prev => [...prev, ...data.questions]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleGenerateBehavioral = async () => {
        try {
            if (!interviewId) return;
            setGeneratingBehavioral(true);
            const data = await generateMoreBehavioral(interviewId);
            if (data?.questions?.length) {
                setBehavioralQuestions(prev => [...prev, ...data.questions]);
            }
        } catch (err) {
            console.error("Behavioral error:", err);
        } finally {
            setGeneratingBehavioral(false);
        }
    };

    const handleUpdateDay = async (dayNumber, updatedTasks) => {
        try {
            await updateRoadmap(interviewId, dayNumber, updatedTasks);
        } catch (err) {
            console.error("Update failed:", err);
        }
    };

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId);
        }
    }, [interviewId]);

    useEffect(() => {
        if (report?.technicalQuestions) {
            setQuestions(report.technicalQuestions);
        }
    }, [report]);

    useEffect(() => {
        if (report?.behavioralQuestions) {
            setBehavioralQuestions(report.behavioralQuestions);
        }
    }, [report]);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (loading || !report) {
        return (
            <main className='loading-screen'>
                <div className="loading-spinner"></div>
                <h1>Loading your interview plan...</h1>
            </main>
        );
    }

    return (
        <>
            <Navbar />
            <div className='interview-page'>
                <div className='interview-layout'>

                    {/* ── Left Navigation / Top Pill Bar on Mobile ── */}
                    <nav className='interview-nav'>
                        <div className="nav-content">
                            <p className='interview-nav__label'>Workspace</p>
                            {NAV_ITEMS.map(item => (
                                <button
                                    key={item.id}
                                    className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''} ${item.mobileOnly ? 'nav-item--mobile-only' : ''}`}
                                    onClick={() => setActiveNav(item.id)}
                                >
                                    <span className='interview-nav__icon'>{item.icon}</span>
                                    <span className='interview-nav__text'>{item.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="nav-desktop-action">
                            <button
                                onClick={() => navigate(`/resume/${interviewId}`)}
                                className="nav-resume-btn"
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                                Create Tailored Resume
                            </button>
                        </div>
                    </nav>

                    <div className='interview-divider' />

                    {/* ── Center Content ── */}
                    <main className='interview-content'>
                        {activeNav === 'technical' && (
                            <section>
                                <div className='content-header'>
                                    <div className="content-header__title-row">
                                        <h2>Technical Questions</h2>
                                        <span className='content-header__count'>
                                            {questions.length} questions
                                        </span>
                                    </div>

                                    <div className="content-header__actions">
                                        <button
                                            className="generate-more-btn"
                                            onClick={handleGenerateMore}
                                            disabled={generating}
                                        >
                                            {generating ? "Generating..." : "➕ Generate More"}
                                        </button>

                                        <button
                                            className="mock-btn"
                                            onClick={() => navigate(`/mock/${interviewId}`)}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                                            Start Mock
                                        </button>

                                        <button
                                            className="resume-btn"
                                            onClick={() => navigate(`/resume/${interviewId}`)}
                                        >
                                            ✨ Resume
                                        </button>
                                    </div>
                                </div>
                                <div className='q-list'>
                                    {questions.map((q, i) => (
                                        <QuestionCard
                                            key={i}
                                            item={q}
                                            index={i}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {activeNav === 'behavioral' && (
                            <section>
                                <div className='content-header'>
                                    <div className="content-header__title-row">
                                        <h2>Behavioral Questions</h2>
                                        <span className='content-header__count'>
                                            {behavioralQuestions.length} questions
                                        </span>
                                    </div>

                                    <div className="content-header__actions">
                                        <button
                                            className="generate-more-btn"
                                            onClick={handleGenerateBehavioral}
                                            disabled={generatingBehavioral}
                                        >
                                            {generatingBehavioral ? "Generating..." : "➕ Generate More"}
                                        </button>

                                        <button
                                            className="mock-btn"
                                            onClick={() => navigate(`/mock/${interviewId}`)}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                                            Start Mock
                                        </button>
                                    </div>
                                </div>
                                <div className='q-list'>
                                    {behavioralQuestions.map((q, i) => (
                                        <QuestionCard key={i} item={q} index={i} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {activeNav === 'roadmap' && (
                            <section>
                                <div className='content-header'>
                                    <div className="content-header__title-row">
                                        <h2>Preparation Road Map</h2>
                                        <span className='content-header__count'>{report?.preparationPlan?.length || 0}-day plan</span>
                                    </div>
                                </div>
                                <div className='roadmap-list'>
                                    {report?.preparationPlan?.map((day) => (
                                        <RoadMapDay key={day.day} day={day} onUpdateDay={handleUpdateDay} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Mobile Analysis View (Accessible via tab on small screens) */}
                        {activeNav === 'analysis' && (
                            <section className="mobile-analysis-section">
                                <div className='content-header'>
                                    <div className="content-header__title-row">
                                        <h2>Profile & Role Match Analysis</h2>
                                    </div>
                                </div>
                                <AnalysisPanel
                                    report={report}
                                    openSection={openSection}
                                    setOpenSection={setOpenSection}
                                />
                            </section>
                        )}
                    </main>

                    <div className='interview-divider' />

                    {/* ── Right Sidebar (Desktop only - 3rd column) ── */}
                    <aside className='interview-sidebar'>
                        <AnalysisPanel
                            report={report}
                            openSection={openSection}
                            setOpenSection={setOpenSection}
                        />
                    </aside>
                </div>

                {showScrollTop && (
                    <button className="scroll-top-btn" onClick={scrollToTop} title="Scroll to top">
                        ↑
                    </button>
                )}
            </div>
        </>
    );
};

export default Interview;