import React, { useState, useRef, useEffect } from 'react';
import "../style/home.scss";
import { useInterview } from '../hooks/useInterview.js';
import { useNavigate } from 'react-router-dom';
import { deleteReport } from '../services/interview.api.js';
import Navbar from '../components/Navbar.jsx';

const Home = () => {
    const [resumeFile, setResumeFile] = useState(null);
    const { loading, generateReport, reports: initialReports } = useInterview() || {};
    const [jobDescription, setJobDescription] = useState("");
    const [selfDescription, setSelfDescription] = useState("");
    const [reports, setReports] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const resumeInputRef = useRef();

    const navigate = useNavigate();

    const handleEdit = (report) => {
        console.log("Edit clicked:", report);
        navigate(`/interview/${report._id}`);
    };

    const handleGenerateReport = async () => {
        const hasJobDesc = Boolean(jobDescription && jobDescription.trim());
        const hasResume = Boolean(resumeFile);
        const hasSelfDesc = Boolean(selfDescription && selfDescription.trim());

        if (!hasJobDesc && !hasResume && !hasSelfDesc) {
            alert("Please provide a Job Description and either upload a Resume or enter a Self-Description.");
            return;
        }

        if (!hasJobDesc) {
            alert("Please provide a Target Job Description.");
            return;
        }

        if (!hasResume && !hasSelfDesc) {
            alert("Please upload a Resume or enter a Quick Self-Description.");
            return;
        }

        try {
            setIsGenerating(true);
            const data = await generateReport({
                jobDescription,
                selfDescription,
                resumeFile
            });

            if (!data || !data._id) {
                alert("Could not generate interview report. Please check your inputs and try again.");
                return;
            }

            navigate(`/interview/${data._id}`);
        } catch (err) {
            console.error("[Generate Report Error]:", err);
            const errorMessage = err?.response?.data?.message || err?.message || "An error occurred while generating the report. Please try again.";
            alert(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this interview plan?");
        if (!confirmDelete) return;

        try {
            await deleteReport(id);
            setReports(prev => prev.filter(report => report._id !== id));
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || err?.message || "Failed to delete report");
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setResumeFile(file);
        }
    };

    useEffect(() => {
        if (initialReports) {
            setReports(initialReports);
        }
    }, [initialReports]);

    if (loading) {
        return (
            <main className='loading-screen'>
                <div className='loading-spinner'></div>
                <h1>Loading your interview workspace...</h1>
            </main>
        );
    }

    return (
        <>
            <Navbar />
            <div className='home-page'>

                {/* Page Header */}
                <header className='page-header'>
                    <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                    <p>Let our AI analyze the job requirements and your unique profile to build a personalized winning strategy.</p>
                </header>

                {/* Main Card */}
                <div className='interview-card'>
                    <div className='interview-card__body'>

                        {/* Left Panel - Job Description */}
                        <div className='panel panel--left'>
                            <div className='panel__header'>
                                <span className='panel__icon'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                    </svg>
                                </span>
                                <h2>Target Job Description</h2>
                                <span className='badge badge--required'>Required</span>
                            </div>
                            <div className='panel__textarea-container'>
                                <textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    className='panel__textarea'
                                    placeholder="Paste the full job description here...&#10;e.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'"
                                    maxLength={5000}
                                />
                                <div className='char-counter'>{jobDescription.length} / 5000 chars</div>
                            </div>
                        </div>

                        {/* Vertical Divider */}
                        <div className='panel-divider' />

                        {/* Right Panel - Profile */}
                        <div className='panel panel--right'>
                            <div className='panel__header'>
                                <span className='panel__icon'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </span>
                                <h2>Your Profile</h2>
                            </div>

                            {/* Upload Resume */}
                            <div className='upload-section'>
                                <label className='section-label'>
                                    <span>Upload Resume</span>
                                    <span className='badge badge--best'>Best Results</span>
                                </label>

                                <label
                                    className={`dropzone ${isDragging ? 'dropzone--dragging' : ''}`}
                                    htmlFor='resume'
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <span className='dropzone__icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="16 16 12 12 8 16" />
                                            <line x1="12" y1="12" x2="12" y2="21" />
                                            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                                        </svg>
                                    </span>

                                    {!resumeFile ? (
                                        <>
                                            <p className='dropzone__title'>Click to upload or drag & drop</p>
                                            <p className='dropzone__subtitle'>PDF or DOCX (Max 5MB)</p>
                                        </>
                                    ) : (
                                        <div className='dropzone__uploaded'>
                                            <span className='file-status'>✅ File Uploaded Successfully</span>
                                            <span className='file-name'>📄 {resumeFile.name}</span>
                                            <button
                                                type="button"
                                                className="remove-file-btn"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setResumeFile(null);
                                                    if (resumeInputRef.current) {
                                                        resumeInputRef.current.value = "";
                                                    }
                                                }}
                                            >
                                                ✕ Remove File
                                            </button>
                                        </div>
                                    )}

                                    <input
                                        ref={resumeInputRef}
                                        hidden
                                        type='file'
                                        id='resume'
                                        name='resume'
                                        accept='.pdf,.docx'
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) setResumeFile(file);
                                        }}
                                    />
                                </label>
                            </div>

                            {/* OR Divider */}
                            <div className='or-divider'><span>OR</span></div>

                            {/* Quick Self-Description */}
                            <div className='self-description'>
                                <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                                <textarea
                                    value={selfDescription}
                                    onChange={(e) => setSelfDescription(e.target.value)}
                                    id='selfDescription'
                                    name='selfDescription'
                                    className='panel__textarea panel__textarea--short'
                                    placeholder="Briefly describe your experience, key skills, and years in the field if you don't have a resume file handy..."
                                />
                            </div>

                            {/* Info Box */}
                            <div className='info-box'>
                                <span className='info-box__icon'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                </span>
                                <p>Either a <strong>Resume file</strong> or a <strong>Self-Description</strong> is required to generate a tailored interview strategy.</p>
                            </div>
                        </div>
                    </div>

                    {/* Card Footer */}
                    <div className='interview-card__footer'>
                        <span className='footer-info'>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            AI Strategy Generation &bull; Approx 30s
                        </span>
                        <button
                            onClick={handleGenerateReport}
                            disabled={isGenerating}
                            className='generate-btn'
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                            </svg>
                            {isGenerating ? "Analyzing & Generating Strategy..." : "Generate My Interview Strategy"}
                        </button>
                    </div>
                </div>

                {/* Recent Reports List */}
                {reports?.length > 0 && (
                    <section className='recent-reports'>
                        <h2>My Recent Interview Plans</h2>
                        <ul className='reports-list'>
                            {reports.map(report => (
                                <li key={report._id} className='report-item'>
                                    {/* HEADER */}
                                    <div className="report-header">
                                        <h3 onClick={() => navigate(`/interview/${report._id}`)}>
                                            {report.title || 'Untitled Position Plan'}
                                        </h3>

                                        <div className="report-actions">
                                            <button
                                                title="View/Edit Plan"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(report);
                                                }}
                                            >
                                                ✏️
                                            </button>

                                            <button
                                                title="Delete Plan"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(report._id);
                                                }}
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </div>

                                    {/* BODY */}
                                    <p className='report-meta'>
                                        Generated on {new Date(report.createdAt).toLocaleDateString()}
                                    </p>

                                    {report.matchScore !== undefined && (
                                        <div className={`match-score ${
                                            report.matchScore >= 80 ? 'score--high'
                                            : report.matchScore >= 60 ? 'score--mid'
                                            : 'score--low'
                                        }`}>
                                            Match Score: {report.matchScore}%
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Page Footer */}
                <footer className='page-footer'>
                    <a href='#'>Privacy Policy</a>
                    <a href='#'>Terms of Service</a>
                    <a href='#'>Help Center</a>
                </footer>
            </div>
        </>
    );
};

export default Home;