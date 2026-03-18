const pdfParse = require("pdf-parse");

const { generateInterviewReport, generateResumePdf } = require("../services/ai.service");
const interviewReportModel = require("../Models/InterViewReports.models.js");

// @description 
// Controller to generate interview report based on user self description resume and job
// 

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

// @description Controller to get interview report by interviewId

// get interview by id
async function getInterviewReportByIdController(req, res) {
  try {
    const { interviewId } = req.params;

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id
    });

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found"
      });
    }

    return res.status(200).json({
      message: "Interview report fetched successfully",
      interviewReport
    });

  } catch (error) {
    console.error("GET BY ID ERROR:", error);

    return res.status(500).json({
      message: "Something went wrong",
      error: error.message
    });
  }
}

// get all the interview of logged in user
async function getAllInterviewReportController(req, res) {
  try {
    const interviewReports = await interviewReportModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan");

    return res.status(200).json({
      message: "Interview reports fetched successfully",
      interviewReports
    });

  } catch (error) {
    console.error("GET ALL ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch reports",
      error: error.message
    });
  }
}

// generate the pdf to resume based on self description

async function generateResumePdfController(req,res){
  const {interviewReportId} = req.params;
  const interviewReport = await interviewReportModel.findById(interviewReportId);
  if(!interviewReport){
    return res.status(404).json({
      message:"Interview report not found."
    })
  }
  const {resume,jobDescription,selfDescription} = interviewReport;
  const pdfBuffer = await generateResumePdf({resume,jobDescription,selfDescription});

  res.set({
    "Content-Type" :"application/pdf",
    "Content-Disposition" : `attachment;filename= resume_${interviewReportId}.pdf`
  })
  res.send(pdfBuffer);
}


module.exports = { generateInterViewReportController, getInterviewReportByIdController,
getAllInterviewReportController,
generateResumePdfController
 };