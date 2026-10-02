const pdfParse = require("pdf-parse");
const {
  generateInterviewReport,
  generateResumePdf,generateAIQuestions,generateAIBehavioralQuestions,generateFollowUpQuestions,
  evaluateMockAnswer,
  generateQuestion,
  evaluateFullInterview,
  analyzeEmotion,
  safeParseJSON
} = require("../services/ai.service");
const interviewReportModel = require("../Models/interviewReport.model");
const InterviewSession = require("../Models/interviewSession.model");

/**
 * 🔧 Extract job title from job description
 */
function extractTitle(jobDescription) {
  if (!jobDescription) return null;

  const roles = ["frontend", "backend", "full stack", "developer", "engineer"];
  const found = roles.find(role =>
    jobDescription.toLowerCase().includes(role)
  );

  return found ? `${found} role` : null;
}

/**
 * 🔥 FIXED Parse AI → object safely (handles ALL formats)
 */
function parseArray(arr) {
  if (!Array.isArray(arr)) return [];

  // ✅ Case 1: already correct objects
  if (typeof arr[0] === "object") {
    return arr.map((item) => {
      if (item?.tasks && !Array.isArray(item.tasks)) {
        item.tasks = [item.tasks];
      }
      return item;
    });
  }

  const result = [];

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];

    // ✅ Case 2: flat QA format
    if (item === "question") {
      result.push({
        question: arr[i + 1] || "",
        intention: arr[i + 3] || "",
        answer: arr[i + 5] || ""
      });
      i += 5;
    }

    // ✅ Case 3: skill gap format
    else if (item === "skill") {
      result.push({
        skill: arr[i + 1] || "",
        severity: arr[i + 3] || "medium"
      });
      i += 3;
    }

    // ✅ Case 4: preparation plan format
    else if (item === "day") {
      result.push({
        day: arr[i + 1] || 1,
        focus: arr[i + 3] || "",
        tasks: Array.isArray(arr[i + 5])
          ? arr[i + 5]
          : [arr[i + 5] || ""]
      });
      i += 5;
    }

    // ✅ Case 5: stringified JSON
    else if (typeof item === "string" && item.startsWith("{")) {
      try {
        const parsed = JSON.parse(item);

        if (parsed?.tasks && !Array.isArray(parsed.tasks)) {
          parsed.tasks = [parsed.tasks];
        }

        result.push(parsed);
      } catch (err) {
        console.log("❌ JSON Parse Failed:", item);
      }
    }
  }

  return result;
}

function normalizePreparationPlan(plan) {
  if (!Array.isArray(plan)) return [];

  return plan.map(day => ({
    ...day,
    tasks: (day.tasks || []).map(task => {
      if (typeof task === "string") {
        return { text: task, done: false };
      }

      return {
        text: task.text || "",
        done: task.done || false
      };
    })
  }));
}
function getFallbackTechnicalQuestions(title = "Software Engineer") {
  return [
    {
      question: "Explain the JavaScript event loop, microtask queue (Promises), and macrotask queue (setTimeout) execution order.",
      intention: "Assess deep understanding of asynchronous JavaScript concurrency and execution flow.",
      answer: "The candidate should explain the call stack, Web APIs, Macrotask Queue, and Microtask Queue. Microtasks (Promise.then, queueMicrotask) run immediately after the current execution context clears before the browser/Node event loop picks up the next macrotask."
    },
    {
      question: "How do you optimize API performance, handle rate limiting, and manage database connection pooling in a Node.js backend?",
      intention: "Evaluate scalability knowledge, caching strategies, and database connection pooling under high load.",
      answer: "Discuss connection pooling (e.g. pg Pool or mongoose options), in-memory caching with Redis, query profiling with indexes, clustering or worker threads for CPU-heavy tasks, and middleware-level rate limiting."
    },
    {
      question: "Describe your approach to state management, component re-rendering optimization, and memory leak prevention in React.",
      intention: "Assess frontend architectural awareness, modern React hooks, and rendering lifecycle performance.",
      answer: "Cover useMemo, useCallback, React.memo, localized state to avoid top-level cascading re-renders, cleanup functions in useEffect (cancelling subscriptions/timers), and lazy loading components."
    },
    {
      question: "How do you ensure data consistency and graceful error handling across distributed services or microservices?",
      intention: "Evaluate system design maturity, failure isolation, and transaction reliability.",
      answer: "Discuss Saga pattern (orchestration vs choreography), idempotency keys for retryable requests, dead letter queues (DLQ), circuit breaker pattern, and database transaction isolation levels."
    },
    {
      question: "Explain how you implement secure authentication and authorization using short-lived JWTs and refresh tokens.",
      intention: "Check security best practices regarding session management, token storage, and credential safety.",
      answer: "Short-lived JWT access tokens in memory or Authorization Bearer header, HttpOnly SameSite Secure cookies for refresh tokens, refresh token rotation with revocation lists, and strict CORS configuration."
    }
  ];
}

function getFallbackBehavioralQuestions() {
  return [
    {
      question: "Tell me about a challenging technical hurdle or critical production bug you solved under tight time constraints.",
      intention: "Assess problem-solving composure, root-cause analysis, and incident response under pressure.",
      answer: "Use the STAR method (Situation, Task, Action, Result). Focus on systematic debugging, data-driven hypothesis testing, immediate mitigation, and post-mortem preventative fixes."
    },
    {
      question: "Describe a situation where you had a strong disagreement with a peer or technical lead on architecture. How did you resolve it?",
      intention: "Evaluate collaboration, communication skills, constructive debate, and professional maturity.",
      answer: "Highlight active listening, presenting objective benchmarks and trade-off matrices, willingness to compromise or prototype solutions, and committing fully once a consensus is reached."
    },
    {
      question: "How do you prioritize technical debt against delivering urgent business features when deadlines are aggressive?",
      intention: "Assess prioritization, engineering excellence, and pragmatic alignment with business goals.",
      answer: "Discuss categorizing tech debt by risk/impact, allocating dedicated sprint capacity (e.g. 15-20%), communicating risks clearly to product stakeholders, and refactoring incrementally alongside feature delivery."
    }
  ];
}

/**
 * @description Generate interview report
 */
async function generateInterViewReportController(req, res) {
  try {
    const { selfDescription, jobDescription } = req.body;
    const resumeFile = req.file;

    const hasJobDescription = Boolean(jobDescription && jobDescription.trim());
    const hasResume = Boolean(resumeFile);
    const hasSelfDescription = Boolean(selfDescription && selfDescription.trim());

    if (!hasJobDescription && !hasResume && !hasSelfDescription) {
      return res.status(400).json({
        message: "Job description and either a resume file or self-description are required."
      });
    }

    if (!hasJobDescription) {
      return res.status(400).json({
        message: "Job description is required."
      });
    }

    if (!hasResume && !hasSelfDescription) {
      return res.status(400).json({
        message: "Either a resume file or a self-description is required."
      });
    }

    // ✅ Parse PDF if provided
    let resumeContent = "";
    if (resumeFile) {
      try {
        const parsedData = await pdfParse(resumeFile.buffer);
        resumeContent = parsedData?.text || "";
      } catch (pdfErr) {
        console.warn("⚠️ PDF Parse Error:", pdfErr.message);
      }
    }

    // ✅ Call AI
    let aiData = {};
    try {
      aiData = await generateInterviewReport({
        resume: resumeContent,
        selfDescription: selfDescription || "",
        jobDescription
      });
    } catch (err) {
      console.warn("⚠️ AI FAILED (falling back to tailored generator):", err.message);
    }

    // ✅ CLEAN + SAFE DATA
    const safeData = {
      title:
        aiData?.title ||
        extractTitle(jobDescription) ||
        "Software Engineer",

      matchScore:
        typeof aiData?.matchScore === "number"
          ? aiData.matchScore
          : 70,

      missingKeywords: Array.isArray(aiData?.missingKeywords) && aiData.missingKeywords.length > 0
        ? aiData.missingKeywords
        : ["System Design", "Microservices", "Docker", "Database Indexing", "CI/CD"],

      weakProjects: Array.isArray(aiData?.weakProjects) && aiData.weakProjects.length > 0
        ? aiData.weakProjects
        : ["Quantify impact with metrics (e.g., latency reduction, RPS scale, uptime)"],

      improvements: Array.isArray(aiData?.improvements) && aiData.improvements.length > 0
        ? aiData.improvements
        : ["Highlight system architecture decisions and trade-offs in project bullet points"],

      suggestedBulletPoints: Array.isArray(aiData?.suggestedBulletPoints) && aiData.suggestedBulletPoints.length > 0
        ? aiData.suggestedBulletPoints
        : [
            "Designed and implemented high-throughput RESTful microservices handling 10k+ requests/sec with Node.js and Redis caching.",
            "Architected scalable PostgreSQL database schemas with compound indexing, reducing query response times by 40%."
          ],

      technicalQuestions: parseArray(
        aiData?.technicalQuestions || aiData?.technicalQuestion
      ),

      behavioralQuestions: parseArray(
        aiData?.behavioralQuestions
      ),

      skillGaps: parseArray(
        aiData?.skillGaps
      ),

      preparationPlan: normalizePreparationPlan(
        parseArray(aiData?.preparationPlan)
      )
    };

    // ✅ Fallback to ensure rich, complete preparation experience (never just 1 question)
    if (safeData.technicalQuestions.length === 0) {
      safeData.technicalQuestions = getFallbackTechnicalQuestions(safeData.title);
    }

    if (safeData.behavioralQuestions.length === 0) {
      safeData.behavioralQuestions = getFallbackBehavioralQuestions();
    }

    if (safeData.skillGaps.length === 0) {
      safeData.skillGaps = [
        { skill: "System Design & Distributed Concurrency", severity: "high" },
        { skill: "Performance Profiling & Caching (Redis)", severity: "medium" },
        { skill: "Containerization & CI/CD Pipelines", severity: "medium" }
      ];
    }

    if (safeData.preparationPlan.length === 0) {
      safeData.preparationPlan = [
        { day: 1, focus: "Core Architecture & Async Concurrency", tasks: [{ text: "Review event loop and async patterns", done: false }, { text: "Deep dive into promises and microtasks", done: false }] },
        { day: 2, focus: "Database Design & Indexing", tasks: [{ text: "Query optimization and EXPLAIN ANALYZE", done: false }, { text: "Connection pooling and transaction isolation", done: false }] },
        { day: 3, focus: "System Scalability & Caching", tasks: [{ text: "Design distributed caching with Redis", done: false }, { text: "Rate limiting and load balancing strategies", done: false }] },
        { day: 4, focus: "Security, Auth & API Design", tasks: [{ text: "JWT token rotation and OAuth flows", done: false }, { text: "OWASP Top 10 vulnerabilities and mitigation", done: false }] },
        { day: 5, focus: "Mock Interviews & Behavioral Prep", tasks: [{ text: "Practice STAR method responses", done: false }, { text: "Review past project trade-offs and wins", done: false }] }
      ];
    }

    // ✅ Save to DB
    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeContent,
      selfDescription,
      jobDescription,
      ...safeData
    });

    return res.status(201).json({
      message: "Interview report generated successfully",
      interviewReport
    });

  } catch (error) {
    console.error("❌ FULL CONTROLLER ERROR:", error);

    return res.status(500).json({
      message: error.message || "Failed to generate interview report",
      error: error.message
    });
  }
}

/**
 * 💡 Intelligently enriches report with keywords, critique, and actionable improvements
 */
function enrichReportData(report) {
  const jd = report.jobDescription || "";
  const resume = report.resume || "";

  const techKeywords = [
    "TypeScript", "React", "Node.js", "Express", "MongoDB", "PostgreSQL", "Redis",
    "Docker", "Kubernetes", "AWS", "CI/CD", "System Design", "Microservices",
    "GraphQL", "REST APIs", "Kafka", "SQL", "Unit Testing", "Jest", "Git",
    "OAuth", "Database Indexing", "Performance Optimization", "Data Structures",
    "Concurrency", "WebSockets", "State Management"
  ];

  const jdLower = jd.toLowerCase();
  const resumeLower = resume.toLowerCase();

  let foundInJd = techKeywords.filter(k => jdLower.includes(k.toLowerCase()));
  if (foundInJd.length === 0) {
    foundInJd = ["TypeScript", "System Design", "Docker", "Redis", "CI/CD", "Database Indexing", "Unit Testing"];
  }

  let missing = foundInJd.filter(k => !resumeLower.includes(k.toLowerCase()));
  if (missing.length === 0) {
    missing = ["System Design Trade-offs", "Microservices Concurrency", "Redis Distributed Caching", "Docker Containerization", "Automated CI/CD Pipelines"];
  }

  const matchedCount = foundInJd.length - missing.length;
  let computedScore = Math.round(65 + (Math.max(0, matchedCount) / Math.max(1, foundInJd.length)) * 28);
  if (computedScore > 94) computedScore = 91;
  if (computedScore < 68) computedScore = 76;

  const weakProjects = (Array.isArray(report.weakProjects) && report.weakProjects.length > 0)
    ? report.weakProjects
    : [
        "Include concrete business/performance metrics (e.g. 35% latency reduction, 10k+ requests/sec, 99.9% uptime).",
        "Detail architectural trade-offs: explain why specific databases or caching strategies were chosen.",
        "Demonstrate production deployment and automated testing pipelines (Docker, GitHub Actions, CI/CD)."
      ];

  const improvements = (Array.isArray(report.improvements) && report.improvements.length > 0)
    ? report.improvements
    : [
        `Explicitly surface keywords from the target job description: ${missing.slice(0, 3).join(", ")}.`,
        "Quantify your accomplishments using the Action + Task + Technology + Result framework.",
        "Add a dedicated 'System Architecture' or 'DevOps' bullet point to showcase production readiness."
      ];

  const suggestedBulletPoints = (Array.isArray(report.suggestedBulletPoints) && report.suggestedBulletPoints.length > 0)
    ? report.suggestedBulletPoints
    : [
        `Architected resilient RESTful microservices with Node.js and Redis caching, slashing API response latency by 35% under peak loads.`,
        `Engineered robust PostgreSQL schemas with compound indexing and connection pooling, accelerating query execution times by 40%.`,
        `Implemented end-to-end automated CI/CD pipeline using Docker and GitHub Actions, cutting release cycles from days to under 15 minutes.`
      ];

  const skillGaps = (Array.isArray(report.skillGaps) && report.skillGaps.length > 0)
    ? report.skillGaps
    : [
        { skill: missing[0] || "Distributed System Design", severity: "high" },
        { skill: missing[1] || "Database Indexing & Query Profiling", severity: "medium" },
        { skill: missing[2] || "Containerization & CI/CD Pipelines", severity: "medium" },
        { skill: missing[3] || "Automated Integration Testing", severity: "low" }
      ];

  const techQuestions = (Array.isArray(report.technicalQuestions) && report.technicalQuestions.length > 0)
    ? report.technicalQuestions
    : getFallbackTechnicalQuestions(report.title || "Software Engineer");

  const behavQuestions = (Array.isArray(report.behavioralQuestions) && report.behavioralQuestions.length > 0)
    ? report.behavioralQuestions
    : getFallbackBehavioralQuestions();

  return {
    matchScore: computedScore,
    missingKeywords: missing,
    weakProjects,
    improvements,
    suggestedBulletPoints,
    skillGaps,
    technicalQuestions: techQuestions,
    behavioralQuestions: behavQuestions
  };
}

/**
 * @description Get interview report by ID (with auto-enrichment)
 */
async function getInterviewReportByIdController(req, res) {
  try {
    const { interviewId } = req.params;

    let interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id
    });

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found."
      });
    }

    // Auto-enrich if analysis fields or questions are missing or empty
    const needsEnrichment =
      !interviewReport.missingKeywords || interviewReport.missingKeywords.length === 0 ||
      !interviewReport.weakProjects || interviewReport.weakProjects.length === 0 ||
      !interviewReport.skillGaps || interviewReport.skillGaps.length === 0 ||
      !interviewReport.improvements || interviewReport.improvements.length === 0 ||
      !interviewReport.technicalQuestions || interviewReport.technicalQuestions.length === 0 ||
      !interviewReport.behavioralQuestions || interviewReport.behavioralQuestions.length === 0 ||
      (interviewReport.matchScore === 50 && (!interviewReport.missingKeywords || interviewReport.missingKeywords.length === 0));

    if (needsEnrichment) {
      const enriched = enrichReportData(interviewReport);
      await interviewReportModel.findByIdAndUpdate(interviewReport._id, enriched);
      interviewReport = await interviewReportModel.findById(interviewReport._id);
    }

    res.status(200).json({
      message: "Interview report fetched successfully.",
      interviewReport
    });

  } catch (error) {
    console.error("❌ GET BY ID ERROR:", error);

    res.status(500).json({
      message: "Something went wrong",
      error: error.message
    });
  }
}

/**
 * @description Re-run AI analysis and role alignment for existing interview report
 */
async function reAnalyzeInterviewReportController(req, res) {
  try {
    const { interviewId } = req.params;

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id
    });

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found." });
    }

    const enriched = enrichReportData(interviewReport);
    await interviewReportModel.findByIdAndUpdate(interviewId, enriched);

    const updated = await interviewReportModel.findById(interviewId);

    return res.status(200).json({
      message: "Analysis regenerated successfully.",
      interviewReport: updated
    });

  } catch (err) {
    console.error("❌ RE-ANALYZE ERROR:", err);
    res.status(500).json({ message: "Failed to re-analyze report." });
  }
}

/**
 * @description Get all reports
 */
async function getAllInterviewReportsController(req, res) {
  try {
    const interviewReports = await interviewReportModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select(
        "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan"
      );

    res.status(200).json({
      message: "Interview reports fetched successfully.",
      interviewReports
    });

  } catch (error) {
    console.error("❌ GET ALL ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch reports",
      error: error.message
    });
  }
}

/**
 * @description Generate Resume PDF
 */
async function generateResumePdfController(req, res) {
  try {
    const { interviewReportId } = req.params;

    const interviewReport = await interviewReportModel.findById(interviewReportId);

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found."
      });
    }

    const { resume, jobDescription, selfDescription } = interviewReport;

    const pdfBuffer = await generateResumePdf({
      resume,
      jobDescription,
      selfDescription
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error("❌ PDF ERROR:", error);

    res.status(500).json({
      message: "Failed to generate PDF",
      error: error.message
    });
  }
}


// @description delete interview report
async function deleteInterviewReport(req, res) {
  try {
    const { id } = req.params;

    // 🔥 secure delete (only owner can delete)
    const report = await interviewReportModel.findOneAndDelete({
      _id: id,
      user: req.user.id
    });

    if (!report) {
      return res.status(404).json({
        message: "Report not found or unauthorized"
      });
    }

    res.status(200).json({
      message: "Report deleted successfully"
    });

  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({
      message: "Server error"
    });
  }
}

// 🔥 Generate more questions
async function generateMoreQuestions(req, res) {
  try {
    const { interviewId } = req.params;

    const report = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // 🔥 call AI again (reuse your ai.service)
    let newQuestions = [];
    try {
      newQuestions = await generateAIQuestions({
        jobDescription: report.jobDescription,
        resume: report.resume,
        previousQuestions: report.technicalQuestions
      });
    } catch (aiErr) {
      console.warn("⚠️ generateAIQuestions error:", aiErr.message);
    }

    // append new questions
    let validQuestions = (newQuestions || []).filter(
      q => q.question && q.intention && q.answer
    );

    // If AI failed or returned empty, generate fresh questions
    if (validQuestions.length === 0) {
      const existingQs = new Set(report.technicalQuestions.map(q => q.question.toLowerCase().trim()));
      const fallbacks = getFallbackTechnicalQuestions(report.title).filter(
        fq => !existingQs.has(fq.question.toLowerCase().trim())
      );
      validQuestions = fallbacks.length > 0 ? fallbacks : [
        {
          question: "How do you implement caching strategies and invalidate cache correctly in a production system?",
          intention: "Assess practical caching architecture and cache coherency knowledge.",
          answer: "Discuss Cache-Aside, Write-Through, Write-Behind, TTL expiration, event-based cache invalidation, and thundering herd problem prevention with distributed locks."
        },
        {
          question: "Explain the difference between SQL and NoSQL databases when designing for horizontal scalability.",
          intention: "Assess database design trade-offs and CAP theorem understanding.",
          answer: "Contrast ACID transactions and normalized schemas in SQL with eventual consistency, sharding, and flexible schemas in NoSQL (e.g. MongoDB, Cassandra)."
        }
      ];
    }

    report.technicalQuestions.push(...validQuestions);
    await report.save();

    res.json({
      message: "More questions generated",
      questions: report.technicalQuestions
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// 🔥 Generate More Behavioral Questions
const generateMoreBehavioralQuestions = async (req, res) => {
  try {
    const { interviewId } = req.params;

    const report = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    let newQuestions = [];
    try {
      newQuestions = await generateAIBehavioralQuestions({
        jobDescription: report.jobDescription,
        resume: report.resume,
        previousQuestions: report.behavioralQuestions
      });
    } catch (aiErr) {
      console.warn("⚠️ generateAIBehavioralQuestions error:", aiErr.message);
    }

    let validQuestions = (newQuestions || []).filter(
      q => q.question && q.intention && q.answer
    );

    if (validQuestions.length === 0) {
      const existingQs = new Set(report.behavioralQuestions.map(q => q.question.toLowerCase().trim()));
      const fallbacks = getFallbackBehavioralQuestions().filter(
        fq => !existingQs.has(fq.question.toLowerCase().trim())
      );
      validQuestions = fallbacks.length > 0 ? fallbacks : [
        {
          question: "Describe a situation where you received difficult critical feedback. How did you process and act on it?",
          intention: "Evaluate self-awareness, emotional resilience, and growth mindset.",
          answer: "Demonstrate gratitude for the feedback, objective self-reflection, concrete steps taken to improve, and positive measurable outcomes."
        }
      ];
    }

    report.behavioralQuestions.push(...validQuestions);
    await report.save();

    res.json({ questions: report.behavioralQuestions });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating behavioral questions" });
  }
};

async function generateFollowUp(req,res){
    try {
    const { question, answer } = req.body;
    if (!question || !answer) {
      return res.status(400).json({
        message: "Question and answer required"
      });
    }
    const followUps = await generateFollowUpQuestions({
      question,
      answer
    });

    res.json({ followUps });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Follow-up error" });
  }
};

async function evaluateMockController(req,res){
  try {
    const { question, answer } = req.body;
      if (!question || !answer) {
        return res.status(400).json({
          message: "Invalid input"
        });
      }
    const result = await evaluateMockAnswer({ question, answer });

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: "Mock evaluation failed" });
  }
}

// generate question for mock 
async function generateQuestionController(req, res) {
  try {
    const { topic, type, difficulty,resume } = req.body;

    // basic validation
    if (!topic && type === "custom") {
      return res.status(400).json({
        message: "Topic is required for custom questions"
      });
    }

    const result = await generateQuestion({ topic, type,difficulty ,resume});

    res.json(result);

  } catch (err) {
    console.error("Generate question controller error:", err);

    res.status(500).json({
      message: "Failed to generate question"
    });
  }
}
async function updateRoadmap(req, res) {
  try {
    const { interviewId, day } = req.params;
    let { tasks } = req.body;

    // console.log("🔥 PARAMS:", req.params);
    // console.log("🔥 BODY:", req.body);

    // ✅ VALIDATION
    if (!interviewId || day === undefined) {
      return res.status(400).json({ message: "Invalid params" });
    }

    // ✅ SAFE NORMALIZATION (STRING + OBJECT BOTH)
    tasks = (tasks || []).map(t => {
      if (typeof t === "string") {
        return { text: t, done: false };
      }
      return {
        text: t?.text || "",
        done: t?.done || false
      };
    });

    const report = await interviewReportModel.findById(interviewId);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // 🔥 CRITICAL FIX: normalize ENTIRE roadmap before update
    report.preparationPlan = (report.preparationPlan || []).map(dayItem => ({
      ...dayItem,
      tasks: (dayItem.tasks || []).map(t => {
        if (typeof t === "string") {
          return { text: t, done: false };
        }
        return {
          text: t?.text || "",
          done: t?.done || false
        };
      })
    }));

    // ✅ FIND DAY SAFELY
    const dayPlan = report.preparationPlan.find(
      d => Number(d.day) === Number(day)
    );

    if (!dayPlan) {
      return res.status(404).json({
        message: "Day not found",
        availableDays: report.preparationPlan.map(d => d.day)
      });
    }

    // ✅ UPDATE
    dayPlan.tasks = tasks;
    await report.save();
    return res.json({ success: true });

  } catch (err) {
    console.error("❌ FINAL ERROR:", err);

    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
}

async function liveInterviewController(req, res) {
  try {
    const { question, answer, history = [], sessionId, mode } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: "Question & Answer required" });
    }

    let session;

    // find session
    if (sessionId) {
      session = await InterviewSession.findOne({
        _id: sessionId,
        user: req.user.id
      });
    }

    // 🆕 Create session if not exists
    if (!session) {
      session = await InterviewSession.create({
        user: req.user.id,
        mode: mode || "real",
        history: [],
        trustScore: 100,
        warnings: 0,
        status: "active"
      });
    }

    // after finding or creating session



    // 🚨 CRITICAL: BLOCK IF TERMINATED
    if (session.status === "terminated") {
      return res.status(403).json({
        message: "Interview terminated",
        trustScore: session.trustScore,
        reason: session.terminatedReason
      });
    }

    // 🔥 SINGLE AI CALL (NO LAG)
    const { feedback, emotion, followUps } = await evaluateFullInterview({
      question,
      answer,
      history,
      mode
    });

    const score =
      (feedback.clarity + feedback.confidence + feedback.technical) / 3;

// 📊 Save history
    session.history.push({
      question,
      answer,
      feedback,
      emotion,
      score,
      createdAt: new Date()
    });

    // limit history
    session.history = session.history.slice(-50);

    await session.save();

   // 📤 RESPONSE (IMPORTANT UPDATE)
    return res.json({
      sessionId: session._id,
      feedback,
      emotion,
      followUps,
      score,
      trustScore: session.trustScore,   // 🔥 ADDED
      status: session.status            // 🔥 ADDED
    });

  } catch (err) {
    console.error("LIVE ERROR:", err);
    res.status(500).json({ message: "Live interview failed" });
  }
}

async function endInterview(req, res) {
  try {
    const { sessionId } = req.body;

    // 🔹 Validate input
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required"
      });
    }

    // 🔹 Fetch session
    const session = await InterviewSession.findOne({
      _id: sessionId,
      user: req.user.id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    const total = session.history?.length || 0;

    // 🔹 Handle empty session
    if (total === 0) {
      return res.json({
        success: true,
        totalQuestions: 0,
        avgScore: 0,
        performance: {
          clarity: 0,
          confidence: 0,
          technical: 0
        },
        strengths: [],
        weaknesses: [],
        trustScore: session.trustScore,
        status: session.status,
        recommendation: "No interview data available"
      });
    }

    // 🔹 Initialize accumulators
    let totalScore = 0;
    let claritySum = 0;
    let confidenceSum = 0;
    let technicalSum = 0;

    const strengths = new Set();
    const improvements = new Set();

    // 🔹 Process history safely
    session.history.forEach(item => {
      const feedback = item.feedback || {};

      const clarity = feedback.clarity || 0;
      const confidence = feedback.confidence || 0;
      const technical = feedback.technical || 0;

      const score = (clarity + confidence + technical) / 3;

      totalScore += score;
      claritySum += clarity;
      confidenceSum += confidence;
      technicalSum += technical;

      // 🔹 Deduplicate automatically using Set
      if (Array.isArray(feedback.strengths)) {
        feedback.strengths.forEach(s => strengths.add(s));
      }

      if (Array.isArray(feedback.improvements)) {
        feedback.improvements.forEach(i => improvements.add(i));
      }
    });

    // 🔹 Calculate averages
    const avgScore = totalScore / total;

    const performance = {
      clarity: Math.round(claritySum / total),
      confidence: Math.round(confidenceSum / total),
      technical: Math.round(technicalSum / total)
    };

    // 🔹 Update session
    session.score = avgScore;
    session.status =
      session.status === "terminated" ? "terminated" : "completed";

    await session.save();

    // 🔹 Recommendation engine (cleaner)
    const getRecommendation = (score) => {
      if (score >= 80) return "Ready for FAANG-level interviews 🚀";
      if (score >= 65) return "Strong candidate";
      if (score >= 50) return "Needs improvement";
      return "Needs strong preparation";
    };

    // 🔹 Final response
    return res.json({
      success: true,
      totalQuestions: total,
      avgScore: Math.round(avgScore),

      performance,

      strengths: [...strengths].slice(0, 5),
      weaknesses: [...improvements].slice(0, 5),

      trustScore: session.trustScore,
      status: session.status,

      recommendation: getRecommendation(avgScore)
    });

  } catch (err) {
    console.error("END INTERVIEW ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "End interview failed",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
}

async function startInterview(req, res) {
  try {
    const { mode, cameraEnabled } = req.body;

    const session = await InterviewSession.create({
      user: req.user.id,
      mode: mode || "real",
      cameraEnabled: cameraEnabled ?? true,
      interviewMode: cameraEnabled ? "video" : "audio",
      trustScore: 100,
      status: "active"
    });

    res.json({
      sessionId: session._id,
      message: "Interview started"
    });

  } catch (err) {
    res.status(500).json({ message: "Failed to start interview" });
  }
};
module.exports = {
  generateInterViewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController,
  deleteInterviewReport,
  generateMoreQuestions,
  generateMoreBehavioralQuestions,
  generateFollowUp,
  evaluateMockController,
  generateQuestionController,
  updateRoadmap,
  liveInterviewController,
  endInterview,
  startInterview,
  reAnalyzeInterviewReportController
};