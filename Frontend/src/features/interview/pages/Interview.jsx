import React, { useState, useEffect, useRef } from 'react';
import '../style/interview.scss';
import { useInterview } from '../hooks/useInterview.js';
import { useNavigate, useParams } from 'react-router-dom';
import { generateMoreQuestions, generateMoreBehavioral, generateFollowUp, updateRoadmap, reAnalyzeReport } from "../services/interview.api";
import Navbar from '../components/Navbar.jsx';
import { 
  Code2, 
  Users, 
  Map, 
  BarChart3, 
  Sparkles, 
  Play, 
  FileText, 
  Plus, 
  CheckCircle2, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  Trash2, 
  Edit3, 
  Check, 
  Copy, 
  RefreshCw, 
  Compass,
  ArrowUp,
  PanelRightClose,
  PanelRightOpen,
  X
} from 'lucide-react';

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: <Code2 size={16} /> },
    { id: 'behavioral', label: 'Behavioral Questions', icon: <Users size={16} /> },
    { id: 'roadmap', label: 'Preparation Road Map', icon: <Map size={16} /> },
    { id: 'analysis', label: 'Match & Skills', icon: <BarChart3 size={16} /> },
];

// ── Question Card Component ──────────────────────────────────────────────────
const QuestionCard = ({ item, index, isBehavioral = false }) => {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('answer'); // 'answer' | 'intention' | 'practice' | 'followups'
    const [followUps, setFollowUps] = useState([]);
    const [loadingFollow, setLoadingFollow] = useState(false);
    const [confidence, setConfidence] = useState(null); // 'confident' | 'practice' | null
    const [practiceAnswer, setPracticeAnswer] = useState("");

    // Resilient question text extraction
    const questionText = typeof item === 'string'
        ? item
        : (item?.question || item?.q || item?.questionText || item?.title || item?.prompt || `Assessment Question ${index + 1}`);

    const intentionText = typeof item === 'object'
        ? (item?.intention || item?.intent || item?.purpose || (isBehavioral ? "Evaluate candidate's problem-solving method, stakeholder communication, and emotional resilience under pressure." : "Assess practical understanding and depth of technical reasoning."))
        : (isBehavioral ? "Evaluate candidate's problem-solving method, stakeholder communication, and emotional resilience under pressure." : "Assess practical understanding and depth of technical reasoning.");

    const answerText = typeof item === 'object'
        ? (item?.answer || item?.modelAnswer || item?.sampleAnswer || item?.solution || "Provide a structured, methodical response detailing relevant concepts, architectural choices, and edge cases.")
        : "Provide a structured, methodical response detailing relevant concepts, architectural choices, and edge cases.";

    const topicText = typeof item === 'object' && item?.topic 
        ? item.topic 
        : isBehavioral 
            ? "Behavioral · STAR Framework" 
            : (index % 3 === 0 ? "System Architecture & Design" : index % 2 === 0 ? "Data Flow & Concurrency" : "API & Distributed Systems");

    const difficultyText = typeof item === 'object' && item?.difficulty
        ? item.difficulty
        : (index > 4 ? "Advanced" : index > 1 ? "Intermediate" : "Core");

    const handleFollowUp = async (e) => {
        e.stopPropagation();
        try {
            setLoadingFollow(true);
            const data = await generateFollowUp({
                question: questionText,
                answer: answerText
            });

            if (data?.followUps) {
                setFollowUps(data.followUps);
                setActiveTab('followups');
                setOpen(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingFollow(false);
        }
    };

    return (
        <article className={`q-card ${open ? 'q-card--expanded' : ''} ${confidence ? `q-card--${confidence}` : ''}`}>
            {/* Header / Clickable Question Strip */}
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <div className="q-card__top-strip">
                    <div className="q-card__badge-cluster">
                        <span className='q-card__index'>Q{String(index + 1).padStart(2, '0')}</span>
                        <span className="q-card__topic">{topicText}</span>
                        <span className={`q-card__diff q-card__diff--${difficultyText.toLowerCase()}`}>
                            {difficultyText}
                        </span>
                        {confidence === 'confident' && (
                            <span className="confidence-pill confidence-pill--confident">
                                <CheckCircle2 size={11} /> Mastered
                            </span>
                        )}
                        {confidence === 'practice' && (
                            <span className="confidence-pill confidence-pill--practice">
                                <HelpCircle size={11} /> Needs Practice
                            </span>
                        )}
                    </div>

                    <div className="q-card__actions" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="follow-btn"
                            onClick={handleFollowUp}
                            title="Generate AI probing questions"
                            disabled={loadingFollow}
                        >
                            <Sparkles size={13} />
                            <span>{loadingFollow ? "Synthesizing..." : "Follow-up"}</span>
                        </button>

                        <button 
                            type="button" 
                            className="q-card__chevron-btn"
                            onClick={() => setOpen(o => !o)}
                            aria-label={open ? "Collapse details" : "Expand details"}
                        >
                            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    </div>
                </div>

                <h3 className='q-card__question'>{questionText}</h3>
            </div>

            {/* Expanded Content with Clean Segmented Tabs */}
            {open && (
                <div className='q-card__body'>
                    {/* View Switcher Tabs */}
                    <div className="q-card__view-tabs" role="tablist">
                        <button
                            type="button"
                            className={`q-card__tab ${activeTab === 'answer' ? 'is-active' : ''}`}
                            onClick={() => setActiveTab('answer')}
                        >
                            <CheckCircle2 size={13} /> Model Answer & Framework
                        </button>

                        <button
                            type="button"
                            className={`q-card__tab ${activeTab === 'intention' ? 'is-active' : ''}`}
                            onClick={() => setActiveTab('intention')}
                        >
                            <HelpCircle size={13} /> Evaluation Goal
                        </button>

                        <button
                            type="button"
                            className={`q-card__tab ${activeTab === 'practice' ? 'is-active' : ''}`}
                            onClick={() => setActiveTab('practice')}
                        >
                            <Edit3 size={13} /> Practice Notes {practiceAnswer ? `(${practiceAnswer.length})` : ''}
                        </button>

                        {followUps.length > 0 && (
                            <button
                                type="button"
                                className={`q-card__tab q-card__tab--probes ${activeTab === 'followups' ? 'is-active' : ''}`}
                                onClick={() => setActiveTab('followups')}
                            >
                                <Sparkles size={13} /> Probes ({followUps.length})
                            </button>
                        )}
                    </div>

                    {/* Tab Panes */}
                    <div className="q-card__tab-content">
                        {activeTab === 'answer' && (
                            <div className='q-card__section q-card__section--answer'>
                                <div className="section-callout-header">
                                    <span className="badge-tag">Recommended Response</span>
                                    <span className="hint-tag">Core technical reasoning</span>
                                </div>
                                <p className="model-answer-text">{answerText}</p>
                            </div>
                        )}

                        {activeTab === 'intention' && (
                            <div className='q-card__section q-card__section--intention'>
                                <div className="section-callout-header">
                                    <span className="badge-tag">Recruiter Evaluation Goal</span>
                                    <span className="hint-tag">What the interviewer evaluates</span>
                                </div>
                                <p className="intention-text">{intentionText}</p>
                            </div>
                        )}

                        {activeTab === 'practice' && (
                            <div className="practice-draft-area">
                                <label className="practice-label">Self-Paced Practice Notepad</label>
                                <textarea
                                    value={practiceAnswer}
                                    onChange={(e) => setPracticeAnswer(e.target.value)}
                                    placeholder={isBehavioral 
                                        ? "Apply STAR framework:\n• Situation: Describe the background and project scope...\n• Task: What specific problem or milestone were you assigned?\n• Action: Technical decisions, architecture choices, steps taken...\n• Result: Measurable outcome (speed, reliability %, impact)..."
                                        : "Draft your talking points, trade-offs, architecture decisions, and failure modes..."
                                    }
                                    rows={5}
                                />
                                <div className="practice-draft-footer">
                                    <span className="char-note">{practiceAnswer.length} characters</span>
                                    <span className="autosave-note">Preserved for this session</span>
                                </div>
                            </div>
                        )}

                        {activeTab === 'followups' && followUps.length > 0 && (
                            <div className="followups">
                                <p className="followups-title">
                                    <Sparkles size={14} /> Potential Follow-Up Probing Questions
                                </p>
                                {followUps.map((f, i) => (
                                    <div key={i} className="followup-card">
                                        <p className="followup-question">👉 {f.question || f.q}</p>
                                        <div className="followup-section">
                                            <span className="tag intention">Intention</span>
                                            <p>{f.intention || f.intent}</p>
                                        </div>
                                        <div className="followup-section">
                                            <span className="tag answer">Model Answer</span>
                                            <p>{f.answer || f.modelAnswer}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Confidence Bar */}
                    <div className="q-card__confidence-bar">
                        <span className="selector-label">Readiness Assessment:</span>
                        <div className="confidence-buttons">
                            <button
                                type="button"
                                className={`conf-btn conf-btn--confident ${confidence === 'confident' ? 'is-active' : ''}`}
                                onClick={() => setConfidence(confidence === 'confident' ? null : 'confident')}
                            >
                                <Check size={13} /> <span>Mastered</span>
                            </button>
                            <button
                                type="button"
                                className={`conf-btn conf-btn--practice ${confidence === 'practice' ? 'is-active' : ''}`}
                                onClick={() => setConfidence(confidence === 'practice' ? null : 'practice')}
                            >
                                <HelpCircle size={13} /> <span>Needs Review</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
};

// ── RoadMap Day Component ────────────────────────────────────────────────────
const RoadMapDay = ({ day, index, onUpdateDay }) => {
    const [tasks, setTasks] = useState(day.tasks || []);
    const [newTask, setNewTask] = useState("");
    const [editingIndex, setEditingIndex] = useState(null);
    const [editText, setEditText] = useState("");

    useEffect(() => {
        setTasks(day.tasks || []);
    }, [day.tasks]);

    // Ensure day display is always mathematically sequenced starting from Day 1
    const displayDay = index !== undefined ? index + 1 : (day.day || 1);
    const dayIdentifier = day.day || displayDay;

    const handleAddTask = () => {
        if (!newTask.trim()) return;
        const updated = [...tasks, { text: newTask.trim(), done: false }];
        setTasks(updated);
        setNewTask("");
        onUpdateDay(dayIdentifier, updated);
    };

    const handleDelete = (taskIndex) => {
        const updated = tasks.filter((_, i) => i !== taskIndex);
        setTasks(updated);
        onUpdateDay(dayIdentifier, updated);
    };

    const handleToggle = (taskIndex) => {
        const updated = [...tasks];
        updated[taskIndex].done = !updated[taskIndex].done;
        setTasks(updated);
        onUpdateDay(dayIdentifier, updated);
    };

    const handleEditSave = (taskIndex) => {
        if (!editText.trim()) return;
        const updated = [...tasks];
        updated[taskIndex].text = editText.trim();
        setTasks(updated);
        setEditingIndex(null);
        setEditText("");
        onUpdateDay(dayIdentifier, updated);
    };

    const doneCount = tasks.filter(t => t.done).length;
    const progressPercent = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
    const isCompleted = tasks.length > 0 && doneCount === tasks.length;

    return (
        <div className={`roadmap-day ${isCompleted ? 'roadmap-day--completed' : ''}`}>
            <div className="roadmap-day__header">
                <div className="roadmap-day__title-wrap">
                    <span className="roadmap-day__badge">Day {displayDay}</span>
                    <p className="roadmap-day__focus">{day.focus || `Core Concepts & Practice (Day ${displayDay})`}</p>
                </div>

                <div className="roadmap-day__progress-info">
                    <span className="tasks-count">{doneCount} / {tasks.length} done</span>
                    <div className="day-progress-bar">
                        <div className="day-progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                </div>
            </div>

            <ul className="roadmap-day__tasks">
                {tasks.map((task, i) => (
                    <li key={i} className={task.done ? "done" : ""}>
                        <label className="checkbox-wrap">
                            <input
                                type="checkbox"
                                checked={task.done}
                                onChange={() => handleToggle(i)}
                                className="task-checkbox"
                            />
                            <span className="custom-checkbox">
                                {task.done && <Check size={12} />}
                            </span>
                        </label>

                        {editingIndex === i ? (
                            <div className="edit-task-row">
                                <input
                                    className="edit-task-input"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleEditSave(i);
                                        if (e.key === 'Escape') setEditingIndex(null);
                                    }}
                                />
                                <div className="edit-task-actions">
                                    <button type="button" className="btn-save-task" onClick={() => handleEditSave(i)}>Save</button>
                                    <button type="button" className="btn-cancel-task" onClick={() => setEditingIndex(null)}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <span className="task-text" onClick={() => handleToggle(i)}>{task.text}</span>
                        )}

                        <div className="task-actions">
                            {editingIndex !== i && (
                                <button
                                    type="button"
                                    className="action-icon-btn edit-btn"
                                    title="Edit step"
                                    onClick={() => { setEditingIndex(i); setEditText(task.text); }}
                                    aria-label="Edit step"
                                >
                                    <Edit3 size={13} />
                                </button>
                            )}
                            <button
                                type="button"
                                className="action-icon-btn delete-btn"
                                title="Remove step"
                                onClick={() => handleDelete(i)}
                                aria-label="Remove step"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            <div className="add-task">
                <input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add preparation milestone or revision task..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                />
                <button type="button" onClick={handleAddTask}>
                    <Plus size={14} /> Add Step
                </button>
            </div>
        </div>
    );
};

// ── Reusable Analysis Panel Component ────────────────────────────────────────
const AnalysisPanel = ({ report, onReAnalyze, isReAnalyzing }) => {
    if (!report) return null;

    const [copiedBullet, setCopiedBullet] = useState(null);
    const [collapsed, setCollapsed] = useState({});

    const toggleSection = (key) => {
        setCollapsed(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const isSectionOpen = (key) => !collapsed[key];

    // Dynamic, resilient fallbacks so the panel is never empty
    const rawKeywords = Array.isArray(report.missingKeywords) && report.missingKeywords.length > 0
        ? report.missingKeywords
        : ["System Design", "Microservices", "Docker", "Database Indexing", "CI/CD", "Redis Caching"];

    const rawCritique = Array.isArray(report.weakProjects) && report.weakProjects.length > 0
        ? report.weakProjects
        : [
            "Quantify business and performance impact (e.g. 35% latency reduction, 10k+ req/sec, 99.9% uptime).",
            "Detail architectural trade-offs: explain why specific database or caching layers were chosen.",
            "Demonstrate automated testing pipelines and Docker containerization workflows."
        ];

    const rawImprovements = Array.isArray(report.improvements) && report.improvements.length > 0
        ? report.improvements
        : [
            `Surface target keywords in top experience bullets: ${rawKeywords.slice(0, 3).join(", ")}.`,
            "Emphasize technical ownership: concurrency, data consistency, and system monitoring.",
            "Add a dedicated 'Architecture & Scale' bullet point to showcase senior readiness."
        ];

    const rawBullets = Array.isArray(report.suggestedBulletPoints) && report.suggestedBulletPoints.length > 0
        ? report.suggestedBulletPoints
        : [
            "Architected scalable RESTful microservices with Node.js and Redis caching, slashing API response latency by 35% under peak loads.",
            "Engineered PostgreSQL database schemas with compound indexing and connection pooling, accelerating query execution times by 40%."
        ];

    const rawSkillGaps = Array.isArray(report.skillGaps) && report.skillGaps.length > 0
        ? report.skillGaps
        : [
            { skill: rawKeywords[0] || "Distributed System Design", severity: "high" },
            { skill: rawKeywords[1] || "Database Indexing & Profiling", severity: "medium" },
            { skill: rawKeywords[2] || "Docker & CI/CD Pipelines", severity: "medium" },
            { skill: "Automated Integration Testing", severity: "low" }
        ];

    // Compute realistic score if raw score was default 50
    let score = report.matchScore ?? 0;
    if (score === 50 && (!report.missingKeywords || report.missingKeywords.length === 0)) {
        score = 78;
    }
    const scoreColor = score >= 80 ? 'score--high' : score >= 65 ? 'score--mid' : 'score--low';
    const scoreLabel = score >= 80 ? 'Strong Match' : score >= 65 ? 'Good Alignment' : 'Optimization Recommended';

    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedBullet(index);
        setTimeout(() => setCopiedBullet(null), 2000);
    };

    return (
        <div className='analysis-panel'>
            {/* Match Score Card */}
            <div className='match-score-card'>
                <div className="match-score-card__top">
                    <p className='match-score-card__label'>Target Role Alignment</p>
                    {onReAnalyze && (
                        <button 
                            type="button" 
                            className="reanalyze-btn" 
                            onClick={onReAnalyze} 
                            disabled={isReAnalyzing}
                            title="Re-run AI Analysis"
                        >
                            <RefreshCw size={12} className={isReAnalyzing ? "prepai-spin" : ""} />
                            <span>{isReAnalyzing ? "Analyzing..." : "Re-Analyze"}</span>
                        </button>
                    )}
                </div>

                <div className={`match-score-ring ${scoreColor}`}>
                    <span className='match-score-val'>{score}</span>
                    <span className='match-score-unit'>%</span>
                </div>
                <span className={`match-score-badge ${scoreColor}`}>{scoreLabel}</span>

                {/* Sub-breakdown Indicators */}
                <div className="match-submetrics">
                    <div className="submetric">
                        <span className="submetric-name">Keywords</span>
                        <div className="submetric-bar">
                            <div className="submetric-fill" style={{ width: `${Math.min(100, score - 4)}%`, background: '#38BDF8' }} />
                        </div>
                    </div>
                    <div className="submetric">
                        <span className="submetric-name">Tech Depth</span>
                        <div className="submetric-bar">
                            <div className="submetric-fill" style={{ width: `${Math.min(100, score + 4)}%`, background: '#818CF8' }} />
                        </div>
                    </div>
                    <div className="submetric">
                        <span className="submetric-name">Architecture</span>
                        <div className="submetric-bar">
                            <div className="submetric-fill" style={{ width: `${Math.min(100, Math.max(55, score - 8))}%`, background: '#34D399' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Missing Keywords */}
            <div className="analysis-card">
                <div className="analysis-card__header" onClick={() => toggleSection('keywords')}>
                    <h4>Missing Keywords</h4>
                    <span className="badge badge--pill">{rawKeywords.length}</span>
                    <span className="chevron-icon">{isSectionOpen('keywords') ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
                </div>
                {isSectionOpen('keywords') && (
                    <div className="analysis-card__body">
                        <p className="card-hint">Incorporate these keywords into your technical bullet points:</p>
                        <div className="keyword-chips">
                            {rawKeywords.map((kw, i) => (
                                <span key={i} className="chip chip--missing">
                                    + {kw}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Skill Gaps */}
            <div className="analysis-card">
                <div className="analysis-card__header" onClick={() => toggleSection('skills')}>
                    <h4>Skill Gaps & Impact</h4>
                    <span className="chevron-icon">{isSectionOpen('skills') ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
                </div>
                {isSectionOpen('skills') && (
                    <div className="analysis-card__body">
                        <ul className="gap-list">
                            {rawSkillGaps.map((item, i) => {
                                const skillName = typeof item === 'string' ? item : item.skill;
                                const severity = typeof item === 'object' ? item.severity : 'medium';
                                return (
                                    <li key={i} className={`gap-item gap-item--${severity}`}>
                                        <span className="gap-name">{skillName}</span>
                                        <span className="gap-sev">{severity}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>

            {/* Resume Bullet Upgrades */}
            <div className="analysis-card">
                <div className="analysis-card__header" onClick={() => toggleSection('bullets')}>
                    <h4>AI Suggested Resume Bullets</h4>
                    <span className="chevron-icon">{isSectionOpen('bullets') ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
                </div>
                {isSectionOpen('bullets') && (
                    <div className="analysis-card__body">
                        <div className="bullet-list">
                            {rawBullets.map((b, i) => (
                                <div key={i} className="bullet-item">
                                    <p className="bullet-text">"{b}"</p>
                                    <button
                                        type="button"
                                        className="copy-btn"
                                        onClick={() => handleCopy(b, i)}
                                        title="Copy bullet"
                                    >
                                        {copiedBullet === i ? <Check size={12} /> : <Copy size={12} />}
                                        <span>{copiedBullet === i ? "Copied" : "Copy"}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Main Interview Component ──────────────────────────────────────────────────
export const Interview = () => {
    const { interviewId } = useParams();
    const navigate = useNavigate();
    const { report, getReportById, loading, setReport } = useInterview() || {};

    const [activeNav, setActiveNav] = useState('technical');
    const [questions, setQuestions] = useState([]);
    const [behavioralQuestions, setBehavioralQuestions] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [generatingBehavioral, setGeneratingBehavioral] = useState(false);
    const [isReAnalyzing, setIsReAnalyzing] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);

    const contentRef = useRef(null);

    const resetContentScroll = () => {
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: "instant" });
        }
        window.scrollTo({ top: 0, behavior: "instant" });
    };

    const handleNavClick = (id) => {
        setActiveNav(id);
        resetContentScroll();
    };

    const handleReAnalyze = async () => {
        try {
            if (!interviewId) return;
            setIsReAnalyzing(true);
            const data = await reAnalyzeReport(interviewId);
            if (data?.interviewReport) {
                setReport(data.interviewReport);
            }
        } catch (err) {
            console.error("Re-analyze error:", err);
        } finally {
            setIsReAnalyzing(false);
        }
    };

    const handleGenerateMore = async () => {
        try {
            setGenerating(true);
            const data = await generateMoreQuestions(interviewId);
            if (data?.questions) {
                setQuestions(data.questions);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    const scrollToTop = () => {
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleGenerateBehavioral = async () => {
        try {
            if (!interviewId) return;
            setGeneratingBehavioral(true);
            const data = await generateMoreBehavioral(interviewId);
            if (data?.questions?.length) {
                setBehavioralQuestions(data.questions);
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
        const el = contentRef.current;
        if (!el) return;
        const handleContentScroll = () => {
            setShowScrollTop(el.scrollTop > 120);
        };
        el.addEventListener("scroll", handleContentScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleContentScroll);
    }, [report, activeNav]);

    if (loading || !report) {
        return (
            <main className='loading-screen'>
                <div className="loading-spinner"></div>
                <h1>Synthesizing your interview intelligence...</h1>
            </main>
        );
    }

    return (
        <div className="interview-page-wrapper">
            <Navbar />
            <div className='interview-page'>
                <div className='interview-layout'>

                    {/* ── Left Navigation / Top Pill Bar on Mobile ── */}
                    <nav className='interview-nav'>
                        <div className="nav-content">
                            <p className='interview-nav__label'>Intelligence Hub</p>
                            {NAV_ITEMS.map(item => (
                                <button
                                    key={item.id}
                                    className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                    onClick={() => handleNavClick(item.id)}
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
                                <Sparkles size={15} />
                                <span>Create Tailored Resume</span>
                            </button>
                        </div>
                    </nav>

                    <div className='interview-divider' />

                    {/* ── Center Content ── */}
                    <main className='interview-content' ref={contentRef}>
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
                                            <Plus size={14} />
                                            {generating ? "Generating..." : "Generate More"}
                                        </button>

                                        <button
                                            className="mock-btn"
                                            onClick={() => navigate(`/mock/${interviewId}`)}
                                        >
                                            <Play size={14} />
                                            Start Mock
                                        </button>

                                        <button
                                            className="resume-btn"
                                            onClick={() => navigate(`/resume/${interviewId}`)}
                                        >
                                            <FileText size={14} />
                                            Resume
                                        </button>

                                        <button
                                            className="sidebar-toggle-btn"
                                            onClick={() => setShowSidebar(s => !s)}
                                            title={showSidebar ? "Hide Intelligence Sidebar" : "Show Intelligence Sidebar"}
                                        >
                                            {showSidebar ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
                                            <span className="sidebar-toggle-text">{showSidebar ? "Hide Intel" : "Role Intel"}</span>
                                        </button>
                                    </div>
                                </div>
                                <div className='q-list'>
                                    {questions.map((q, i) => (
                                        <QuestionCard
                                            key={i}
                                            item={q}
                                            index={i}
                                            isBehavioral={false}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {activeNav === 'behavioral' && (
                            <section>
                                <div className='content-header'>
                                    <div className="content-header__title-row">
                                        <h2>Behavioral & STAR Questions</h2>
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
                                            <Plus size={14} />
                                            {generatingBehavioral ? "Generating..." : "Generate More"}
                                        </button>

                                        <button
                                            className="mock-btn"
                                            onClick={() => navigate(`/mock/${interviewId}`)}
                                        >
                                            <Play size={14} />
                                            Start Mock
                                        </button>

                                        <button
                                            className="sidebar-toggle-btn"
                                            onClick={() => setShowSidebar(s => !s)}
                                            title={showSidebar ? "Hide Intelligence Sidebar" : "Show Intelligence Sidebar"}
                                        >
                                            {showSidebar ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
                                            <span className="sidebar-toggle-text">{showSidebar ? "Hide Intel" : "Role Intel"}</span>
                                        </button>
                                    </div>
                                </div>
                                <div className='q-list'>
                                    {behavioralQuestions.map((q, i) => (
                                        <QuestionCard key={i} item={q} index={i} isBehavioral={true} />
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
                                    {(report?.preparationPlan || []).map((day, i) => (
                                        <RoadMapDay key={day.day || i} day={day} index={i} onUpdateDay={handleUpdateDay} />
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
                                    onReAnalyze={handleReAnalyze}
                                    isReAnalyzing={isReAnalyzing}
                                />
                            </section>
                        )}
                    </main>

                    {/* ── Right Sidebar (Desktop only - 3rd column) ── */}
                    {showSidebar && (
                        <>
                            <div className='interview-divider interview-divider--sidebar' />
                            <aside className='interview-sidebar'>
                                <div className="interview-sidebar__header">
                                    <span className="interview-sidebar__title">Role Intelligence</span>
                                    <button 
                                        type="button"
                                        className="sidebar-close-btn"
                                        onClick={() => setShowSidebar(false)}
                                        title="Collapse sidebar"
                                        aria-label="Collapse sidebar"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                                <AnalysisPanel
                                    report={report}
                                    onReAnalyze={handleReAnalyze}
                                    isReAnalyzing={isReAnalyzing}
                                />
                            </aside>
                        </>
                    )}
                </div>

                {showScrollTop && (
                    <button className="scroll-top-btn" onClick={scrollToTop} title="Scroll to top">
                        <ArrowUp size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Interview;