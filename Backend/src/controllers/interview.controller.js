const pdfParse = require("pdf-parse");

const generateInterviewReport = require("../services/ai.service.js");
const interviewReportModel = require("../Models/InterViewReports.models.js");

async function generateInterViewReportController(req, res) {
  try {
    const resumeFile = req.file;

    if (!resumeFile) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    // ✅ Extract PDF text
    const parsedData = await pdfParse(resumeFile.buffer);
    const resumeContent = parsedData.text;

    const { selfDescription, jobDescription } = req.body;

    // ✅ Call AI service
    const interViewReportByAi = await generateInterviewReport({
      resume: resumeContent,
      selfDescription,
      jobDescription
    });

    // ⚠️ Safety check (important)
    if (!interViewReportByAi) {
      return res.status(500).json({ message: "AI response failed" });
    }

    // ✅ Save to DB
    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeContent,
      selfDescription,
      jobDescription,
      ...interViewReportByAi
    });

    // ✅ Send response
    return res.status(201).json({
      message: "Interview report generated successfully",
      interviewReport
    });

  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      message: "Something went wrong",
      error: error.message
    });
  }
}

module.exports = { generateInterViewReportController };