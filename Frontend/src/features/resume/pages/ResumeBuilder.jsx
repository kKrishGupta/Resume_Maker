import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import ResumeEditor from "../components/ResumeEditor";
import ResumePreviewLive from "../components/ResumePreviewLive";
import { useResume } from "../hooks/useResume";
import { downloadPDF } from "../services/resume.api";
import "../style/resume.scss";

const templateOptions = [
  {
    key: "minimal",
    title: "Minimal",
    copy: "Quiet typography and ATS-first whitespace for conservative hiring pipelines.",
  },
  {
    key: "modern",
    title: "Modern",
    copy: "Balanced visual polish with SaaS-style spacing and crisp metadata treatment.",
  },
  {
    key: "tech",
    title: "Tech",
    copy: "Stronger accent lines, dense signal, and developer-friendly project emphasis.",
  },
  {
    key: "creative",
    title: "Creative",
    copy: "Higher contrast highlight blocks for design-forward portfolios and hybrid roles.",
  },
];

const assistantMessages = [
  {
    role: "assistant",
    text: "I found strong backend signals in your projects. Want me to tighten the summary for product engineering roles?",
  },
  {
    role: "user",
    text: "Yes, keep it ATS-friendly and concise.",
  },
  {
    role: "assistant",
    text: "Done. I also surfaced JWT, MongoDB transactions, and AI API integration for better recruiter scanning.",
  },
];

function triggerFileDownload(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function trimLink(value) {
  return `${value || ""}`
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

function buildLatexExport(resume) {
  const lines = [
    "\\documentclass{resumeforge}",
    "\\begin{document}",
    `\\name{${resume.name || ""}}`,
    `\\role{${resume.role || ""}}`,
    `\\contact{${[
      resume.phone,
      resume.email,
      trimLink(resume.github),
      trimLink(resume.linkedin),
      trimLink(resume.leetcode),
      trimLink(resume.portfolio),
    ]
      .filter(Boolean)
      .join(" | ")}}`,
    `\\summary{${resume.summary || ""}}`,
    "",
    "\\experience{",
  ];

  (resume.experience || []).forEach((item) => {
    lines.push(
      `  \\roleitem{${item.title || ""}}{${item.company || ""}}{${item.startDate || ""} -- ${item.endDate || ""}}`
    );
    (item.points || []).forEach((point) => {
      lines.push(`  \\bullet{${point}}`);
    });
    lines.push("");
  });

  lines.push("}", "", "\\projects{");

  (resume.projects || []).forEach((item) => {
    lines.push(
      `  \\project{${item.name || ""}}{${item.role || ""}}{${item.stack || ""}}`
    );
    (item.points || []).forEach((point) => {
      lines.push(`  \\bullet{${point}}`);
    });
    lines.push("");
  });

  lines.push("}", "", "\\skills{");
  (resume.skills || []).forEach((item) => {
    lines.push(`  \\skill{${item}}`);
  });
  lines.push("}", "", "\\education{");

  (resume.education || []).forEach((item) => {
    lines.push(
      `  \\educationitem{${item.school || ""}}{${item.degree || ""}}{${item.startDate || ""} -- ${item.endDate || ""}}{${item.score || ""}}`
    );
  });

  lines.push("}", "\\end{document}");
  return lines.join("\n");
}

function buildDslLines(resume) {
  const lines = [];
  const push = (parts, error = false) => lines.push({ parts, error });

  push([{ type: "comment", text: "% ResumeForge ATS DSL v2.4" }]);
  push([{ type: "comment", text: "% Live-synced from the smart editor" }]);
  push([{ type: "blank", text: "" }]);
  push(
    [
      { type: "keyword", text: "\\name" },
      { type: "brace", text: "{" },
      { type: "string", text: resume.name || "Missing name" },
      { type: "brace", text: "}" },
    ],
    !resume.name
  );
  push(
    [
      { type: "keyword", text: "\\role" },
      { type: "brace", text: "{" },
      { type: "string", text: resume.role || "Missing role" },
      { type: "brace", text: "}" },
    ],
    !resume.role
  );
  push(
    [
      { type: "keyword", text: "\\contact" },
      { type: "brace", text: "{" },
      {
        type: "string",
        text: [
          resume.phone,
          resume.email,
          trimLink(resume.github),
          trimLink(resume.linkedin),
          trimLink(resume.leetcode),
          trimLink(resume.portfolio),
        ]
          .filter(Boolean)
          .join(" | "),
      },
      { type: "brace", text: "}" },
    ],
    !resume.email || !resume.phone
  );
  push(
    [
      { type: "keyword", text: "\\summary" },
      { type: "brace", text: "{" },
      { type: "string", text: resume.summary || "Add a recruiter-facing summary" },
      { type: "brace", text: "}" },
    ],
    !resume.summary
  );
  push([{ type: "blank", text: "" }]);
  push([
    { type: "keyword", text: "\\experience" },
    { type: "brace", text: " {" },
  ]);

  (resume.experience || []).forEach((item) => {
    push(
      [
        { type: "indent", text: "  " },
        { type: "macro", text: "@role" },
        { type: "brace", text: "{" },
        { type: "string", text: item.title || "Missing title" },
        { type: "brace", text: "}" },
      ],
      !item.title
    );
    push(
      [
        { type: "indent", text: "  " },
        { type: "macro", text: "@company" },
        { type: "brace", text: "{" },
        { type: "string", text: item.company || "Missing company" },
        { type: "brace", text: "}" },
      ],
      !item.company
    );
    push(
      [
        { type: "indent", text: "  " },
        { type: "macro", text: "@dates" },
        { type: "brace", text: "{" },
        {
          type: "string",
          text: `${item.startDate || "?"} -- ${item.endDate || "?"}`,
        },
        { type: "brace", text: "}" },
      ],
      !item.startDate || !item.endDate
    );
    (item.points || []).forEach((point) => {
      push(
        [
          { type: "indent", text: "  " },
          { type: "bullet", text: "- " },
          { type: "string", text: point || "Missing bullet" },
        ],
        !point
      );
    });
    push([{ type: "blank", text: "" }]);
  });

  push([{ type: "brace", text: "}" }]);
  push([{ type: "blank", text: "" }]);
  push([
    { type: "keyword", text: "\\projects" },
    { type: "brace", text: " {" },
  ]);

  (resume.projects || []).forEach((item) => {
    push(
      [
        { type: "indent", text: "  " },
        { type: "macro", text: "@project" },
        { type: "brace", text: "{" },
        { type: "string", text: item.name || "Missing project name" },
        { type: "brace", text: "}" },
      ],
      !item.name
    );
    push(
      [
        { type: "indent", text: "  " },
        { type: "macro", text: "@links" },
        { type: "brace", text: "{" },
        {
          type: "string",
          text: [trimLink(item.liveUrl), trimLink(item.githubUrl)]
            .filter(Boolean)
            .join(" | "),
        },
        { type: "brace", text: "}" },
      ],
      !item.liveUrl || !item.githubUrl
    );
    (item.points || []).forEach((point) => {
      push(
        [
          { type: "indent", text: "  " },
          { type: "bullet", text: "- " },
          { type: "string", text: point || "Missing project detail" },
        ],
        !point
      );
    });
    push([{ type: "blank", text: "" }]);
  });

  push([{ type: "brace", text: "}" }]);
  push([{ type: "blank", text: "" }]);
  push([
    { type: "keyword", text: "\\skills" },
    { type: "brace", text: "{" },
    { type: "string", text: (resume.skills || []).join(", ") || "Add skills" },
    { type: "brace", text: "}" },
  ]);
  push([
    { type: "keyword", text: "\\education" },
    { type: "brace", text: " {" },
  ]);

  (resume.education || []).forEach((item) => {
    push(
      [
        { type: "indent", text: "  " },
        { type: "macro", text: "@school" },
        { type: "brace", text: "{" },
        { type: "string", text: item.school || "Missing school" },
        { type: "brace", text: "}" },
      ],
      !item.school
    );
    push(
      [
        { type: "indent", text: "  " },
        { type: "macro", text: "@degree" },
        { type: "brace", text: "{" },
        { type: "string", text: item.degree || "Missing degree" },
        { type: "brace", text: "}" },
      ],
      !item.degree
    );
  });

  push([{ type: "brace", text: "}" }]);
  return lines;
}

function buildJsonLines(resume) {
  return JSON.stringify(resume, null, 2).split("\n").map((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('"') && line.includes(":")) {
      const index = line.indexOf(":");
      const before = line.slice(0, index);
      const after = line.slice(index + 1);

      return {
        error: false,
        parts: [
          { type: "json", text: before },
          { type: "brace", text: ":" },
          { type: "string", text: after },
        ],
      };
    }

    return {
      error: false,
      parts: [{ type: trimmed === "" ? "blank" : "json", text: line }],
    };
  });
}

function AppIcon({ name }) {
  const icons = {
    compile: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 6h12v12H6z" />
        <path d="M10 10l4 2-4 2z" />
      </svg>
    ),
    download: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4v10" />
        <path d="M8 10l4 4 4-4" />
        <path d="M5 19h14" />
      </svg>
    ),
    score: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 14a8 8 0 1116 0" />
        <path d="M12 14l4-6" />
      </svg>
    ),
    ai: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="7" width="14" height="10" rx="4" />
        <circle cx="10" cy="12" r="1" />
        <circle cx="14" cy="12" r="1" />
        <path d="M10 15h4" />
      </svg>
    ),
    template: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="14" rx="3" />
        <path d="M9 5v14" />
      </svg>
    ),
    sun: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3" />
        <path d="M12 19v3" />
        <path d="M2 12h3" />
        <path d="M19 12h3" />
      </svg>
    ),
    moon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 3a8.5 8.5 0 108 8.5A7 7 0 0116 3z" />
      </svg>
    ),
    share: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="18" cy="5" r="2" />
        <circle cx="6" cy="12" r="2" />
        <circle cx="18" cy="19" r="2" />
        <path d="M8 12l8-6" />
        <path d="M8 12l8 6" />
      </svg>
    ),
    message: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6h14v10H9l-4 3z" />
      </svg>
    ),
  };

  return <span className="resume-app-icon">{icons[name]}</span>;
}

function CircularScore({ score }) {
  const safeScore = Math.max(0, Math.min(100, Number(score || 0)));
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="resume-score-circle">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="resume-score-circle__track" cx="60" cy="60" r={radius} />
        <circle
          className="resume-score-circle__progress"
          cx="60"
          cy="60"
          r={radius}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: dashOffset,
          }}
        />
      </svg>
      <strong>{safeScore}</strong>
      <span>ATS Score</span>
    </div>
  );
}

function ResumeCodeEditor({
  resume,
  analytics,
  codeView,
  onCodeViewChange,
  onCompile,
  isCompiling,
  isSpotlight,
}) {
  const lines = codeView === "json" ? buildJsonLines(resume) : buildDslLines(resume);
  const errorCount = lines.filter((line) => line.error).length;

  return (
    <section
      className={`resume-code-editor ${isSpotlight ? "is-spotlight" : ""} ${
        isCompiling ? "is-compiling" : ""
      }`}
    >
      <header className="resume-code-editor__header">
        <div>
          <p className="resume-code-editor__eyebrow">Advanced Editor</p>
          <h2>Resume DSL / JSON</h2>
        </div>

        <div className="resume-code-editor__controls">
          <div className="resume-code-editor__tabs">
            <button
              className={codeView === "dsl" ? "is-active" : ""}
              type="button"
              onClick={() => onCodeViewChange("dsl")}
            >
              Resume DSL
            </button>
            <button
              className={codeView === "json" ? "is-active" : ""}
              type="button"
              onClick={() => onCodeViewChange("json")}
            >
              JSON Resume
            </button>
          </div>

          <button className="resume-code-editor__compile" type="button" onClick={onCompile}>
            <AppIcon name="compile" />
            {isCompiling ? "Compiling..." : "Recompile"}
          </button>
        </div>
      </header>

      <div className="resume-code-editor__statusbar">
        <span>{errorCount ? `${errorCount} issues highlighted` : "No syntax warnings"}</span>
        <span>Autosuggestions enabled</span>
        <span>Live preview hot reload</span>
      </div>

      <div className="resume-code-editor__viewport">
        {lines.map((line, index) => (
          <div
            className={`resume-code-editor__line ${line.error ? "is-error" : ""}`}
            key={`${codeView}-${index}`}
          >
            <span className="resume-code-editor__number">{index + 1}</span>
            <span className="resume-code-editor__content">
              {line.parts.map((part, partIndex) => (
                <span
                  className={`resume-code-editor__token resume-code-editor__token--${part.type}`}
                  key={`${part.text}-${partIndex}`}
                >
                  {part.text}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>

      <footer className="resume-code-editor__footer">
        <div>
          <p>AI suggestions</p>
          <div className="resume-code-editor__chips">
            {(analytics.keywords || []).slice(0, 4).map((keyword) => (
              <span key={keyword}>{keyword}</span>
            ))}
          </div>
        </div>

        <div>
          <p>Missing signals</p>
          <ul>
            {(analytics.missingKeywords || []).slice(0, 3).map((keyword) => (
              <li key={keyword}>{keyword}</li>
            ))}
          </ul>
        </div>
      </footer>
    </section>
  );
}

export default function ResumeBuilder() {
  const { id } = useParams();
  const { resume, analytics, handleAIImprove, setResume } = useResume(id);
  const [theme, setTheme] = useState("light");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [atsDetailsOpen, setAtsDetailsOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState("fit");
  const [codeView, setCodeView] = useState("dsl");
  const [isCompiling, setIsCompiling] = useState(false);
  const [codeSpotlight, setCodeSpotlight] = useState(false);
  const [saveLabel, setSaveLabel] = useState("Live sync ready");
  const [toast, setToast] = useState({
    visible: true,
    tone: "info",
    text: "ResumeForge is ready. Edits compile live into the preview.",
  });
  const toastTimerRef = useRef(null);
  const resumeChangeRef = useRef(false);

  const atsScore = Math.max(0, Math.min(100, Math.round(Number(analytics?.score || 0))));

  const showToast = (text, tone = "info") => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToast({
      visible: true,
      tone,
      text,
    });

    toastTimerRef.current = window.setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        visible: false,
      }));
    }, 2800);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!resumeChangeRef.current) {
      resumeChangeRef.current = true;
      return;
    }

    setSaveLabel("Autosaving...");

    const timer = window.setTimeout(() => {
      setSaveLabel("Autosaved just now");
      showToast("Autosaved changes to your workspace.", "success");
    }, 1150);

    return () => window.clearTimeout(timer);
  }, [resume]);

  const pulseCodePanel = () => {
    setCodeSpotlight(true);
    window.setTimeout(() => setCodeSpotlight(false), 1400);
  };

  const handleCompile = () => {
    setIsCompiling(true);
    pulseCodePanel();
    setPreviewZoom("fit");

    window.setTimeout(() => {
      setIsCompiling(false);
      setSaveLabel("Compilation successful");
      showToast("Resume compiled successfully. Preview refreshed.", "success");
    }, 900);
  };

  const handleDownload = async () => {
    try {
      const blob = await downloadPDF(resume);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `${(resume.name || "resume").replace(/\s+/g, "-").toLowerCase()}.pdf`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      showToast("PDF download started.", "success");
    } catch (error) {
      showToast("PDF export failed. Please try again.", "error");
    }
  };

  const handleDownloadJson = () => {
    triggerFileDownload("resume.json", JSON.stringify(resume, null, 2), "application/json");
    showToast("JSON export ready.", "success");
  };

  const handleDownloadLatex = () => {
    triggerFileDownload("resume.tex", buildLatexExport(resume));
    showToast("LaTeX export ready.", "success");
  };

  const handleShareLink = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?template=${resume.template || "tech"}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Share link copied to clipboard.", "success");
        return;
      }
    } catch (error) {
      console.log("Clipboard unavailable", error);
    }

    showToast(`Share link: ${shareUrl}`, "info");
  };

  const handleAIOptimize = async () => {
    await handleAIImprove();
    showToast("AI optimization suggestions applied.", "success");
  };

  const handleTemplateChange = (templateKey) => {
    setResume((prev) => ({
      ...prev,
      template: templateKey,
    }));
    setTemplatesOpen(false);
    showToast(`${templateKey[0].toUpperCase()}${templateKey.slice(1)} template applied.`, "success");
  };

  const previewScale = previewZoom === "100" ? 1 : 0.9;

  return (
    <div className="resume-ui resume-page resume-page--builder">
      <div className={`resume-workbench resume-workbench--${theme}`}>
        <div className="resume-workbench__backdrop" />

        <div className="resume-workbench__shell">
          <header className="resume-workbench__nav">
            <div className="resume-brand">
              <div className="resume-brand__mark">RF</div>
              <div>
                <strong>ResumeForge</strong>
                <span>Overleaf-grade resume workspace</span>
              </div>
            </div>

            <div className="resume-workbench__nav-actions">
              <button type="button" onClick={handleCompile}>
                <AppIcon name="compile" />
                Compile / Generate Resume
              </button>
              <button type="button" onClick={handleDownload}>
                <AppIcon name="download" />
                Download PDF
              </button>
              <button type="button" onClick={() => setAtsDetailsOpen((prev) => !prev)}>
                <AppIcon name="score" />
                ATS Score
              </button>
              <button type="button" onClick={handleAIOptimize}>
                <AppIcon name="ai" />
                AI Optimize
              </button>
              <button type="button" onClick={() => setTemplatesOpen(true)}>
                <AppIcon name="template" />
                Templates
              </button>
            </div>

            <div className="resume-workbench__nav-profile">
              <span className="resume-workbench__sync">{saveLabel}</span>

              <button
                className="resume-theme-toggle"
                type="button"
                onClick={() =>
                  setTheme((prev) => (prev === "light" ? "dark" : "light"))
                }
              >
                <AppIcon name={theme === "light" ? "moon" : "sun"} />
                {theme === "light" ? "Dark" : "Light"}
              </button>

              <button className="resume-profile-chip" type="button">
                KG
              </button>
            </div>
          </header>

          <div className="resume-workbench__body">
            <aside className="resume-workbench__panel resume-workbench__panel--code">
              <ResumeCodeEditor
                analytics={analytics}
                codeView={codeView}
                isCompiling={isCompiling}
                isSpotlight={codeSpotlight}
                onCodeViewChange={setCodeView}
                onCompile={handleCompile}
                resume={resume}
              />
            </aside>

            <main className="resume-workbench__panel resume-workbench__panel--form">
              <ResumeEditor
                onAIImprove={handleAIOptimize}
                onOpenAssistant={() => setAssistantOpen(true)}
                onSwitchToCodeMode={() => {
                  setCodeView("dsl");
                  pulseCodePanel();
                  showToast("Code editor focused. Smart form remains live-linked.", "info");
                }}
                resume={resume}
                setResume={setResume}
              />
            </main>

            <section className="resume-workbench__panel resume-workbench__panel--preview">
              <div className="resume-preview-stage__toolbar">
                <div>
                  <p className="resume-preview-stage__eyebrow">Live Resume Preview</p>
                  <h2>ATS-friendly A4 output</h2>
                </div>

                <div className="resume-preview-stage__toolbar-actions">
                  <div className="resume-preview-stage__zoom">
                    <button
                      className={previewZoom === "100" ? "is-active" : ""}
                      type="button"
                      onClick={() => setPreviewZoom("100")}
                    >
                      100%
                    </button>
                    <button
                      className={previewZoom === "fit" ? "is-active" : ""}
                      type="button"
                      onClick={() => setPreviewZoom("fit")}
                    >
                      Fit
                    </button>
                  </div>

                  <span className="resume-preview-stage__page">Page 1 / 1</span>
                </div>
              </div>

              <div className="resume-preview-stage">
                <div className="resume-preview-stage__sheet-shell">
                  <div
                    className="resume-preview-stage__sheet-scale"
                    style={{ transform: `scale(${previewScale})` }}
                  >
                    <ResumePreviewLive resume={resume} />
                  </div>
                </div>

                <aside className="resume-ats-card">
                  <div className="resume-ats-card__header">
                    <span>Live ATS Score</span>
                    <strong>Great Match</strong>
                  </div>

                  <CircularScore score={atsScore} />

                  <div className="resume-ats-card__meta">
                    <span>Resume Compatibility</span>
                    <div className="resume-ats-card__bar">
                      <span style={{ width: `${atsScore}%` }} />
                    </div>
                  </div>

                  <button type="button" onClick={handleAIOptimize}>
                    Improve with AI
                  </button>
                </aside>

                {atsDetailsOpen && (
                  <aside className="resume-ats-drawer">
                    <div className="resume-ats-drawer__head">
                      <div>
                        <p>ATS Feedback</p>
                        <h3>Optimization signals</h3>
                      </div>
                      <button type="button" onClick={() => setAtsDetailsOpen(false)}>
                        Close
                      </button>
                    </div>

                    <CircularScore score={atsScore} />

                    <div className="resume-ats-drawer__block">
                      <h4>Missing Keywords</h4>
                      <div className="resume-ats-drawer__chips">
                        {(analytics.missingKeywords || []).map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </div>
                    </div>

                    <div className="resume-ats-drawer__block">
                      <h4>Formatting Issues</h4>
                      <ul>
                        {(analytics.formattingIssues || []).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="resume-ats-drawer__block">
                      <h4>Suggestions</h4>
                      <ul>
                        {(analytics.suggestions || []).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <button type="button" onClick={handleAIOptimize}>
                      Improve with AI
                    </button>
                  </aside>
                )}
              </div>

              <div className="resume-preview-stage__exports">
                <button type="button" onClick={handleDownloadJson}>
                  <AppIcon name="download" />
                  Download JSON
                </button>
                <button type="button" onClick={handleDownloadLatex}>
                  <AppIcon name="download" />
                  Download LaTeX
                </button>
                <button type="button" onClick={handleShareLink}>
                  <AppIcon name="share" />
                  Share via Link
                </button>
              </div>
            </section>
          </div>
        </div>

        {templatesOpen && (
          <aside className="resume-template-drawer">
            <div className="resume-template-drawer__head">
              <div>
                <p>Templates</p>
                <h3>Choose a resume direction</h3>
              </div>
              <button type="button" onClick={() => setTemplatesOpen(false)}>
                Close
              </button>
            </div>

            <div className="resume-template-drawer__grid">
              {templateOptions.map((template) => (
                <button
                  className={`resume-template-card ${
                    resume.template === template.key ? "is-active" : ""
                  }`}
                  key={template.key}
                  type="button"
                  onClick={() => handleTemplateChange(template.key)}
                >
                  <span className={`resume-template-card__preview resume-template-card__preview--${template.key}`} />
                  <strong>{template.title}</strong>
                  <small>{template.copy}</small>
                </button>
              ))}
            </div>
          </aside>
        )}

        {assistantOpen && (
          <aside className="resume-assistant">
            <div className="resume-assistant__head">
              <div>
                <p>AI Assistant</p>
                <h3>Resume Copilot</h3>
              </div>
              <button type="button" onClick={() => setAssistantOpen(false)}>
                Close
              </button>
            </div>

            <div className="resume-assistant__messages">
              {assistantMessages.map((message, index) => (
                <article
                  className={`resume-assistant__bubble resume-assistant__bubble--${message.role}`}
                  key={`${message.role}-${index}`}
                >
                  <span>{message.role === "assistant" ? "AI" : "You"}</span>
                  <p>{message.text}</p>
                </article>
              ))}
            </div>

            <div className="resume-assistant__actions">
              <button type="button" onClick={handleAIOptimize}>
                Rewrite Bullet Points
              </button>
              <button type="button" onClick={handleAIOptimize}>
                Generate Summary
              </button>
              <button type="button" onClick={handleAIOptimize}>
                Suggest Skills
              </button>
            </div>

            <label className="resume-assistant__input">
              <AppIcon name="message" />
              <input placeholder="Ask for stronger ATS phrasing or recruiter feedback..." />
            </label>
          </aside>
        )}

        {toast.visible && (
          <div className={`resume-toast resume-toast--${toast.tone}`}>{toast.text}</div>
        )}
      </div>
    </div>
  );
}
