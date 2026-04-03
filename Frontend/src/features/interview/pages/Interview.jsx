import React, { useState, useEffect,useRef } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, useParams } from 'react-router-dom'
import { logout } from "../../auth/services/auth.api.js"; // adjust path if needed
import { generateMoreQuestions,generateMoreBehavioral , generateFollowUp,evaluateMockAnswer,generateQuestion,updateRoadmap,liveInterview} from "../services/interview.api";

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
]

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [ open, setOpen ] = useState(false);
    const [followUps, setFollowUps] = useState([]);
    const [loadingFollow, setLoadingFollow] = useState(false);
    const handleFollowUp = async () => {
    try {
        setLoadingFollow(true);

        const data = await generateFollowUp({
        question: item.question,
        answer: item.answer
        });

        setFollowUps(data.followUps);

    } catch (err) {
        console.error(err);
    } finally {
        setLoadingFollow(false);
    }
    };

    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                 {/* 🔥 ADD THIS BUTTON */}
                    <button
                        className="follow-btn"
                        onClick={(e) => {
                        e.stopPropagation(); // VERY IMPORTANT
                        handleFollowUp();
                        }}
                    >
                        {loadingFollow ? "Thinking..." : "💬 Ask"}
                    </button>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
                
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>

                {/* 🔥 FOLLOW-UP SECTION */}
                    {followUps.length > 0 && (
                    <div className="followups">
                        {followUps.map((f, i) => (
                        <div key={i} className="followup-card">

                            <p className="followup-question">
                            👉 {f.question}
                            </p>

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
    )
}



const RoadMapDay = ({ day, onUpdateDay }) => {
  const [tasks, setTasks] = useState(
    day.tasks || []
  );
  const [newTask, setNewTask] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");

  // 🔥 ADD TASK
  const handleAddTask = () => {
    if (!newTask.trim()) return;

    const updated = [...tasks, { text: newTask, done: false }];
    setTasks(updated);
    setNewTask("");

    onUpdateDay(day.day, updated);
  };

  // 🔥 DELETE TASK
  const handleDelete = (index) => {
    const updated = tasks.filter((_, i) => i !== index);
    setTasks(updated);
    onUpdateDay(day.day, updated);
  };

  // 🔥 TOGGLE COMPLETE
  const handleToggle = (index) => {
    const updated = [...tasks];
    updated[index].done = !updated[index].done;

    setTasks(updated);
    onUpdateDay(day.day, updated);
  };

  // 🔥 EDIT TASK
  const handleEditSave = (index) => {
    const updated = [...tasks];
    updated[index].text = editText;

    setTasks(updated);
    setEditingIndex(null);
    onUpdateDay(day.day, updated);
  };

  return (
    <div className='roadmap-day'>
      <div className='roadmap-day__header'>
        <span className='roadmap-day__badge'>Day {day.day}</span>
        <h3 className='roadmap-day__focus'>{day.focus}</h3>
      </div>

      <ul className='roadmap-day__tasks'>
        {tasks.map((task, i) => (
          <li key={i} className={task.done ? "done" : ""}>

            {/* ✔ TOGGLE */}
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => handleToggle(i)}
            />

            {/* ✏ EDIT */}
            {editingIndex === i ? (
              <>
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
                <button onClick={() => handleEditSave(i)}>💾</button>
              </>
            ) : (
              <>
                <span>{task.text}</span>

                <button onClick={() => {
                  setEditingIndex(i);
                  setEditText(task.text);
                }}>✏</button>
              </>
            )}

            {/* 🗑 DELETE */}
            <button onClick={() => handleDelete(i)}>🗑</button>

          </li>
        ))}
      </ul>

      {/* ➕ ADD TASK */}
      <div className="add-task">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add new task..."
        />
        <button onClick={handleAddTask}>➕</button>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical')
    const { report, getReportById, loading, getResumePdf } = useInterview();
    const [generating, setGenerating] = useState(false);
    const [questions, setQuestions] = useState([]);
    const { interviewId } = useParams()
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [behavioralQuestions, setBehavioralQuestions] = useState([]);
    const [generatingBehavioral, setGeneratingBehavioral] = useState(false);
    // 🔥 MOCK INTERVIEW STATE
    const [mockMode, setMockMode] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mockAnswer, setMockAnswer] = useState("");
    const [mockResult, setMockResult] = useState(null);
    const [loadingMock, setLoadingMock] = useState(false);
    const [mockType, setMockType] = useState("technical");
    const [customTopic, setCustomTopic] = useState("");
    const [generatedQuestion, setGeneratedQuestion] = useState("");
    const [loadingGen, setLoadingGen] = useState(false);
    const [difficulty, setDifficulty] = useState("medium");
    const [openSection , setOpenSection] = useState("keywords");
    const [isListening, setIsListening] = useState(false);
    const [conversation, setConversation] = useState([]);
    const recognitionRef = useRef(null);
    const [sessionTime, setSessionTime] = useState(15); // minutes
    const [timeLeft, setTimeLeft] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mode, setMode] = useState("practice"); // practice | real
    const [cameraStream, setCameraStream] = useState(null);
    const videoRef = useRef(null);
    const navigate = useNavigate();
    const handleGenerateMore = async () => {
        try {
            setGenerating(true);

            const data = await generateMoreQuestions(interviewId);

            setQuestions(prev => [...prev, ...data.questions]);

        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerateBehavioral = async () => {
  try {
    setGeneratingBehavioral(true);

    const data = await generateMoreBehavioral(interviewId);

    setBehavioralQuestions(data.questions);

  } catch (err) {
    console.error(err);
  } finally {
    setGeneratingBehavioral(false);
  }
    };

    const handleUpdateDay = async (dayNumber, updatedTasks) => {
  try {
    // console.log("Saving to backend:", dayNumber, updatedTasks);

    // 🔥 CALL API (we will connect backend next)
    await updateRoadmap(interviewId, dayNumber, updatedTasks);

  } catch (err) {
    console.error("Update failed:", err);
  }
}

const speak = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
};

    useEffect(() => {
    if (report?.technicalQuestions) {
        setQuestions(report.technicalQuestions);
    }
    }, [report]);

    useEffect(() => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech Recognition not supported");
    return;
  }

  const recognition = new SpeechRecognition();
 recognition.continuous = true;

recognition.onerror = (event) => {
  if (event.error === "no-speech") {
    console.log("🎤 No speech detected, retrying...");

    // 🔥 auto restart for better UX
    if (isListening) {
      recognition.start();
    }

  } else if (event.error === "not-allowed") {
    alert("Microphone permission denied");
  } else {
    console.error("Speech error:", event.error);
  }
};
  recognition.lang = "en-US";

recognition.onresult = async (event) => {
  let transcript = "";
  for (let i = event.resultIndex; i < event.results.length; i++) {
    transcript += event.results[i][0].transcript;
  }
  setMockAnswer(transcript);
  await handleMockEvaluate(transcript);
};

  recognition.onend = () => {
    setIsListening(false);
  };

  recognitionRef.current = recognition;
}, []);

useEffect(() => {
  return () => {
    stopCamera();
  };
}, []);

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [ interviewId ]);

    useEffect(() => {
  if (report?.behavioralQuestions) {
    setBehavioralQuestions(report.behavioralQuestions);
  }
}, [report]);

useEffect(() => {
  let timer;

  if (isRunning && timeLeft > 0) {
    timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
  }

  if (timeLeft === 0 && isRunning) {
    alert("⏱ Interview Time Over!");
    setMockMode(false);
    setIsRunning(false);
  }

  return () => clearInterval(timer);
}, [isRunning, timeLeft]);

const startSession = () => {
  setTimeLeft(sessionTime * 60);
  setIsRunning(true);
};

const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    setCameraStream(stream);

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

  } catch (err) {
    console.error("Camera error:", err);
  }
};

const stopCamera = () => {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    setCameraStream(null);
  }
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    setIsFullscreen(true);
  } else {
    document.exitFullscreen();
    setIsFullscreen(false);
  }
};

const handleLogout = async () => {
    try {
        await logout(); // 🔥 call backend logout

        // optional cleanup (if you store anything)
        localStorage.removeItem("token");

        // redirect
        navigate("/login");
    } catch (err) {
        console.error("Logout failed:", err);
    }
};

const handleMockEvaluate = async (voiceInput = null) => {
  try {
    setLoadingMock(true);

    let selectedQuestion;

    if (mockType === "technical") {
      selectedQuestion = questions[currentIndex]?.question;
    } else if (mockType === "behavioral") {
      selectedQuestion = behavioralQuestions[currentIndex]?.question;
    } else {
      selectedQuestion = generatedQuestion || customTopic;
    }

   let data;

if (mode === "practice") {
  // 🔥 softer AI (training mode)
  data = await liveInterview({
    question: selectedQuestion,
    answer:typeof voiceInput === "string"? voiceInput: mockAnswer,
    history: conversation,
    mode: "practice"
  });
} else {
  // 🔥 strict real interview
  data = await liveInterview({
    question: selectedQuestion,
    answer: voiceInput || mockAnswer,
    history: conversation,
    mode: "real"
  });
}

    setMockResult(data.feedback);

    // 🔥 STOP OLD VOICE
    speechSynthesis.cancel();

    // 🔥 AI SPEAK
    const msg = data?.feedback?.strengths?.length
      ? "Good. " + data.feedback.strengths[0]
      : "Your answer needs improvement.";

    speak(msg);

    // 🔥 AUTO NEXT QUESTION (REAL FLOW)
    setTimeout(() => {
      handleNextQuestion();
    }, 2500);

  } catch (err) {
    console.error(err);
  } finally {
    setLoadingMock(false);
  }
};

const handleNextQuestion = () => {
  if (mockType === "custom") {
    // generate new question instead of index
    setGeneratedQuestion("");
    setMockAnswer("");
    setMockResult(null);
    return;
  }

  if (currentIndex < questions.length - 1) {
    setCurrentIndex(prev => prev + 1);
    setMockAnswer("");
    setMockResult(null);
  } else {
    alert("🎉 Interview Completed!");
    setMockMode(false);
  }
};
const handleGenerateQuestion = async () => {
  try {
    let topicToSend = customTopic;

if (mockType === "technical") {
  topicToSend = "technical interview";
} else if (mockType === "behavioral") {
  topicToSend = "behavioral interview";
}

const data = await generateQuestion({
  topic: topicToSend,
  type: mockType,
  difficulty
});

    setGeneratedQuestion(data.question);

  } catch (err) {
    console.error(err);
  } finally {
    setLoadingGen(false);
  }
};

useEffect(() => {
  if (mockMode) {
    startCamera();
  }
}, [mockMode]);

useEffect(() => {
  let question;

  if (mockType === "technical") {
    question = questions[currentIndex]?.question;
  } else if (mockType === "behavioral") {
    question = behavioralQuestions[currentIndex]?.question;
  } else {
    question = generatedQuestion;
  }

  if (question) {
    speak(question); // 🔥 AI asks question
  }
}, [currentIndex, generatedQuestion]);

useEffect(() => {
  if (mockType === "custom" && !customTopic) return;

  const timer = setTimeout(() => {
    handleGenerateQuestion();
  }, 300);

  return () => clearTimeout(timer);

}, [customTopic, mockType, difficulty]);

// ✅ SAFE ACCESS (no crash)
const scoreColor =
  report?.matchScore >= 80 ? 'score--high' :
  report?.matchScore >= 60 ? 'score--mid' : 'score--low';

// ✅ THEN CONDITIONAL RETURN
if (loading || !report) {
  return (
    <main className='loading-screen'>
      <h1>Loading your interview plan...</h1>
    </main>
  );
}

    return (
        <div className='interview-page'>
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate(`/resume/${interviewId}`)}
                        className="button primary-button">
                        <svg height={"0.8rem"} style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                        ✨ Create Resume
                    </button>

                        {/* ✅ LOGOUT BUTTON */}
                   <button
    onClick={handleLogout}
    type="button"   // ✅ important
    className="button logout-button"
>
    🚪 Logout
</button>


                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <div className="header-left">
                                    <h2>Technical Questions</h2>
                                    <span className='content-header__count'>
                                    {questions.length} questions
                                    </span>
                                </div>


                                 {/* 🔥 ADD BUTTON HERE */}
                       <button
                        className="generate-more-btn"
                        onClick={handleGenerateMore}
                        disabled={generating}
                        >
                        {generating ? "Generating..." : "➕ Generate More"}
                        </button>

                        {/* 🎤 ADD THIS HERE */}
                        <button
                        className="mock-btn"
                        onClick={() => setMockMode(true)}
                        >
                        🎤 Start Mock Interview
                        </button>
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
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{report.behavioralQuestions.length || 0} questions</span>

                                 <button
                                    className="generate-more-btn"
                                    onClick={handleGenerateBehavioral}
                                    disabled={generatingBehavioral}
                                >
                                    {generatingBehavioral ? "Generating..." : "➕ Generate More"}
                                </button>
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
                                <h2>Preparation Road Map</h2>
                                <span className='content-header__count'>{report.preparationPlan.length}-day plan</span>
                            </div>
                            <div className='roadmap-list'>
                                {report.preparationPlan.map((day) => (
                                    <RoadMapDay key={day.day} day={day} onUpdateDay={handleUpdateDay}/>
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>Strong match for this role</p>
                    </div>
                        {/* 🔥 MISSING KEYWORDS */}
                        <div className="analysis-section">
                            <p className="analysis-title"
                                onClick={() => setOpenSection("keywords")}
                            >
                                ❌ Missing Keywords
                            </p>

                            {openSection === "keywords" && (
                                <div className="analysis-list">
                                {report?.missingKeywords?.map((item, i) => (
                                    <span key={i} className="analysis-tag">{item}</span>
                                ))}
                                </div>
                            )}
                            </div>

                        <div className='sidebar-divider' />

                        {/* 🔥 WEAK PROJECTS */}
                       <div className="analysis-section">
                            <p className="analysis-title">⚠ Weak Projects</p>

                            {report?.weakProjects?.length > 0 ? (
                                report.weakProjects.map((item, i) => (
                                <p key={i} className="analysis-text">{item}</p>
                                ))
                            ) : (
                                <p className="analysis-empty">No weak projects detected</p>
                            )}
                        </div>

                        <div className='sidebar-divider' />

                        {/* 🔥 IMPROVEMENTS */}
                        <div className="analysis-section">
                        <p className="analysis-title">💡 Improvements</p>
                        {report?.improvements?.map((item, i) => (
                            <p key={i} className="analysis-text">• {item}</p>
                        ))}
                        </div>

                        <div className='sidebar-divider' />

                        {/* 🔥 BULLET POINTS */}
                        <div className="analysis-section">
                        <p className="analysis-title">✨ Resume Boost Lines</p>
                        {report?.suggestedBulletPoints?.map((item, i) => (
                            <p key={i} className="analysis-text highlight">• {item}</p>
                        ))}
                        </div>

                    {/* Skill Gaps */}
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {report?.skillGaps?.map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>

                </aside>

                
            </div>
             {showScrollTop && (
            <button className="scroll-top-btn" onClick={scrollToTop}>
                ⬆
            </button>
        )}

        {mockMode && (
  <div className="mock-overlay">

    <div className="mock-container premium">

  {/* HEADER */}
  <div className="mock-header premium-header">
    <div>
      <h2>🎤 AI Interview</h2>
      <p className="mock-subtitle">Real-time voice interview</p>
    </div>

    <div className="status-indicator">
      <span className={`dot ${isListening ? "live" : ""}`}></span>
      {isListening ? "Listening..." : "Idle"}
    </div>

    <button className="exit-btn" onClick={() => {stopCamera() , setMockMode(false)}}>
      ✕
    </button>
  </div>

          {/* 🔥 SESSION BAR */}
<div className="session-bar">

  {/* ⏱ TIMER */}
  <div className="timer">
    ⏱ {Math.floor(timeLeft / 60)}:
    {String(timeLeft % 60).padStart(2, "0")}
  </div>

  {/* 🎯 MODE */}
  <select value={mode} onChange={(e) => setMode(e.target.value)}>
    <option value="practice">🧪 Practice</option>
    <option value="real">🔥 Real</option>
  </select>

  {/* ⏳ TIME */}
  <select
    value={sessionTime}
    onChange={(e) => setSessionTime(Number(e.target.value))}
    disabled={isRunning}
  >
    <option value={15}>15 min</option>
    <option value={20}>20 min</option>
    <option value={30}>30 min</option>
  </select>

  {/* ▶ START */}
  <button onClick={startSession} disabled={isRunning}>
    ▶ Start
  </button>

  {/* 🎥 CAMERA */}
  <button onClick={startCamera}>🎥</button>

  {/* 🖥 FULLSCREEN */}
  <button onClick={toggleFullscreen}>
    {isFullscreen ? "🡼" : "⛶"}
  </button>

</div>

  {/* CONTROLS */}
  <div className="mock-controls premium-controls">
    <select
      value={mockType}
      onChange={(e) => {
        setMockType(e.target.value);
        setGeneratedQuestion("");
      }}
    >
      <option value="technical">🧠 Technical</option>
      <option value="behavioral">💬 Behavioral</option>
      <option value="custom">🎯 Custom</option>
    </select>

    <select
      value={difficulty}
      onChange={(e) => {
        setDifficulty(e.target.value);
        setGeneratedQuestion("");
      }}
    >
      <option value="easy">🟢 Easy</option>
      <option value="medium">🟡 Medium</option>
      <option value="hard">🔴 Hard</option>
    </select>

    {mockType === "custom" && (
      <input
        type="text"
        placeholder="Enter topic..."
        value={customTopic}
        onChange={(e) => {
          setCustomTopic(e.target.value);
          setGeneratedQuestion("");
          setMockAnswer("");
          setMockResult(null);
        }}
      />
    )}
  </div>

  {/* QUESTION */}
  <div className="question-card">
    <span className="question-label">Question</span>
    <p className="mock-question">
      {generatedQuestion
        ? generatedQuestion
        : mockType === "technical"
        ? questions[currentIndex]?.question
        : mockType === "behavioral"
        ? behavioralQuestions[currentIndex]?.question
        : customTopic
        ? "⚡ Generating..."
        : "⚠️ Enter a topic"}
    </p>
  </div>

  {/* ANSWER BOX */}
  <div className="answer-box">
    <textarea
      value={mockAnswer}
      onChange={(e) => setMockAnswer(e.target.value)}
      placeholder="Speak or type your answer..."
    />
  </div>

  {/* ACTION BUTTONS */}
  <div className="action-row">

    {/* 🎤 MIC */}
    <button
      className={`mic-btn ${isListening ? "active" : ""}`}
      onClick={() => {
        if (!recognitionRef.current) return;

        if (isListening) {
          recognitionRef.current.stop();
          setIsListening(false);
        } else {
          recognitionRef.current.start();
          setIsListening(true);
        }
      }}
    >
      {isListening ? "🛑" : "🎤"}
    </button>

    {/* 🚀 SUBMIT */}
    <button
      className="submit-btn"
      onClick={() => handleMockEvaluate()}
      disabled={
        isListening || // 🔥 prevent double submit
        !mockAnswer ||
        (mockType === "custom" && !generatedQuestion)
      }
    >
      {loadingMock ? "Analyzing..." : "🚀 Submit"}
    </button>
  </div>

  {/* 🎥 ADD HERE */}
  <video
    ref={videoRef}
    autoPlay
    muted
    playsInline
    className="camera-feed floating"
  />

  {/* RESULT */}
  {mockResult && (
    <div className="result-panel">

      {/* SCORE */}
      <div className="score-grid">
        <div className="score-card">
          <span>Clarity</span>
          <h3>{mockResult.clarity}</h3>
        </div>
        <div className="score-card">
          <span>Confidence</span>
          <h3>{mockResult.confidence}</h3>
        </div>
        <div className="score-card">
          <span>Technical</span>
          <h3>{mockResult.technical}</h3>
        </div>
      </div>

      {/* FEEDBACK */}
      <div className="feedback-section">
        <h4>✅ Strengths</h4>
        {mockResult.strengths.map((s, i) => (
          <p key={i}>{s}</p>
        ))}

        <h4>❌ Improvements</h4>
        {mockResult.improvements.map((i, idx) => (
          <p key={idx}>{i}</p>
        ))}
      </div>

      <button className="next-btn" onClick={handleNextQuestion}>
        Next Question →
      </button>
    </div>
  )}
</div>
  </div>
)}
{/* 🎥 CAMERA VIEW */}

        </div>

        
    )
}

export default Interview