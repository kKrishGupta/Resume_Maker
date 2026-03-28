const pdfParse = require("pdf-parse");
const {
  generateInterviewReport,
  generateResumePdf,generateAIQuestions,generateAIBehavioralQuestions,generateFollowUpQuestions,
  evaluateMockAnswer,
  generateQuestion
} = require("../services/ai.service");
const interviewReportModel = require("../Models/interviewReport.model");

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
/**
 * @description Generate interview report
 */
async function generateInterViewReportController(req, res) {
  try {
    const resumeFile = req.file;

    if (!resumeFile) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    // ✅ Parse PDF
    const parsedData = await pdfParse(resumeFile.buffer);
    const resumeContent = parsedData.text;

    const { selfDescription, jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({
        message: "Job description is required"
      });
    }

    // ✅ Call AI
    let aiData = {};
    try {
      aiData = await generateInterviewReport({
        resume: resumeContent,
        selfDescription,
        jobDescription
      });
    } catch (err) {
      console.log("⚠️ AI FAILED:", err.message);
    }

    // console.log("🧠 AI RESPONSE:", aiData);

    // ✅ CLEAN + SAFE DATA
    const safeData = {
      title:
        aiData?.title ||
        extractTitle(jobDescription) ||
        "Software Engineer",

      matchScore:
        typeof aiData?.matchScore === "number"
          ? aiData.matchScore
          : 50,
// 🔥 ADD THESE (THIS IS YOUR BUG FIX)
          missingKeywords: aiData?.missingKeywords || [],
          weakProjects: aiData?.weakProjects || [],
          improvements: aiData?.improvements || [],
          suggestedBulletPoints: aiData?.suggestedBulletPoints || [],

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

    // ✅ fallback to avoid empty UI
    if (safeData.technicalQuestions.length === 0) {
      safeData.technicalQuestions.push({
        question: "Explain event loop in JavaScript",
        intention: "Check async understanding",
        answer: "Explain call stack, callback queue, and event loop"
      });
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
      message: "Something went wrong",
      error: error.message
    });
  }
}

/**
 * @description Get interview report by ID
 */
async function getInterviewReportByIdController(req, res) {
  try {
    const { interviewId } = req.params;

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id
    });

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found."
      });
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

    const report = await interviewReportModel.findById(interviewId);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // 🔥 call AI again (reuse your ai.service)
    const newQuestions = await generateAIQuestions({
      jobDescription: report.jobDescription,
      resume: report.resume,
      previousQuestions: report.technicalQuestions
    });

    // append new questions
    report.technicalQuestions.push(...newQuestions);

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

    const report = await interviewReportModel.findById(interviewId);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const newQuestions = await generateAIBehavioralQuestions({
      jobDescription: report.jobDescription,
      resume: report.resume,
      previousQuestions: report.behavioralQuestions
    });

    report.behavioralQuestions.push(...newQuestions);
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

    const result = await evaluateMockAnswer({ question, answer });

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: "Mock evaluation failed" });
  }
}

// generate question for mock 
async function generateQuestionController(req, res) {
  try {
    const { topic, type, difficulty  } = req.body;

    // basic validation
    if (!topic && type === "custom") {
      return res.status(400).json({
        message: "Topic is required for custom questions"
      });
    }

    const result = await generateQuestion({ topic, type,difficulty });

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
  updateRoadmap
};