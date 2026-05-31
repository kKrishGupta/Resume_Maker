const resumeService = require("../services/resume.service");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { validateRequest, rateLimit } = require("../middleware/validation");
const { ResumeSchema } = require("../validators/resume.validator");
const logger = require("../utils/logger");

// 🔥 SAVE - with validation and rate limiting
exports.saveResumeController = asyncHandler(async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user?.id;

    if (!userId) {
      logger.warn('Unauthorized save attempt');
      throw new AppError("Unauthorized access", 401, "UNAUTHORIZED");
    }

    // Validate request body
    const validated = ResumeSchema.parse(req.body);

    const resume = await resumeService.saveResume(userId, validated);

    logger.info(`Resume saved for user ${userId}`, { 
      duration: Date.now() - startTime 
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Resume saved successfully",
      resume
    });

  } catch (err) {
    logger.error('Save resume error:', { 
      message: err.message,
      userId: req.user?.id,
      duration: Date.now() - startTime
    });
    next(err);
  }
});

// 🔥 GET
exports.getResumeController = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Unauthorized access", 401, "UNAUTHORIZED");
    }

    const resume = await resumeService.getResume(userId);

    if (!resume) {
      logger.info(`No resume found for user ${userId}`);
      return res.status(200).json({ 
        success: true, 
        statusCode: 200,
        message: "No resume found",
        resume: null 
      });
    }

    logger.info(`Resume fetched for user ${userId}`);

    res.status(200).json({ 
      success: true, 
      statusCode: 200,
      message: "Resume fetched successfully",
      resume 
    });

  } catch (err) {
    logger.error('Get resume error:', { message: err.message });
    next(err);
  }
});

// 🔥 AI IMPROVE
exports.improveResumeController = asyncHandler(async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new AppError("Resume data is required", 400, "MISSING_RESUME_DATA");
    }

    const improved = await resumeService.improveResume(req.body);

    logger.info(`Resume improved for user ${req.user?.id}`, {
      duration: Date.now() - startTime
    });

    res.status(200).json({ 
      success: true, 
      statusCode: 200,
      message: "Resume improved successfully",
      resume: improved 
    });

  } catch (err) {
    logger.error('Improve resume error:', { 
      message: err.message,
      duration: Date.now() - startTime
    });
    next(err);
  }
});

// 🔥 PDF
exports.generateResumePdfController = asyncHandler(async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new AppError("Resume data is required for PDF generation", 400, "MISSING_RESUME_DATA");
    }

    const pdfBuffer = await resumeService.generateResumePDF(req.body);

    if (!pdfBuffer) {
      throw new AppError("Failed to generate PDF", 500, "PDF_GENERATION_FAILED");
    }

    logger.info(`PDF generated for user ${req.user?.id}`, {
      size: pdfBuffer.length,
      duration: Date.now() - startTime
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=resume_${Date.now()}.pdf`,
      "Content-Length": pdfBuffer.length
    });

    res.send(pdfBuffer);

  } catch (err) {
    logger.error('PDF generation error:', { 
      message: err.message,
      duration: Date.now() - startTime
    });
    next(err);
  }
});

exports.analyzeResumeController = asyncHandler(async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new AppError("Resume data is required for analysis", 400, "MISSING_RESUME_DATA");
    }

    const analysis = await resumeService.analyzeResume(req.body);

    if (!analysis) {
      throw new AppError("Analysis failed", 500, "ANALYSIS_FAILED");
    }

    logger.info(`Resume analyzed for user ${req.user?.id}`, {
      duration: Date.now() - startTime
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Resume analyzed successfully",
      analysis
    });

  } catch (err) {
    logger.error('Analyze resume error:', { 
      message: err.message,
      duration: Date.now() - startTime
    });
    next(err);
  }
});
