const Resume = require("../Models/resume.model");
const {safeParseJSON } = require("./ai.service");
const { generateAI } = require("./ai.engine");
const { ResumeSchema } = require("../validators/resume.validator");
const { normalizeResume } = require("../utils/normalizeResume");
const{analyzeATS} = require("./ats.service");
const {generateResumePDF} = require("./pdf.service");
const logger = require("../utils/logger");
const { AppError } = require("../middleware/errorHandler");

/**
 * Save or update user's resume
 * @param {string} userId - User ID
 * @param {object} data - Resume data to save
 * @returns {object} Saved resume document
 */
async function saveResume(userId, data) {
  // ✅ STEP 1: Validate inputs
  if (!userId || typeof userId !== 'string') {
    throw new AppError('Invalid user ID', 400, 'INVALID_USER_ID');
  }

  if (!data || typeof data !== 'object') {
    throw new AppError('Resume data must be an object', 400, 'INVALID_DATA');
  }

  try {
    // ✅ STEP 2: NORMALIZE
    const normalized = normalizeResume(data);

    // ✅ STEP 3: VALIDATE
    const validated = ResumeSchema.parse(normalized);

    // ✅ STEP 4: UPSERT (Update or Create)
    let resume = await Resume.findOne({
      user: userId
    });

    if (resume) {
      // Update existing resume with change tracking
      const previousData = resume.toObject();
      resume.set(validated);
      resume.updatedAt = new Date();
      await resume.save();
      
      logger.info(`Resume updated for user ${userId}`, {
        sections: Object.keys(validated),
        timestamp: new Date().toISOString()
      });
    } else {
      // Create new resume
      resume = await Resume.create({
        user: userId,
        ...validated,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      logger.info(`Resume created for user ${userId}`, {
        timestamp: new Date().toISOString()
      });
    }

    return resume;
  } catch (error) {
    logger.error('Error saving resume', {
      userId,
      message: error.message,
      name: error.name
    });
    throw error;
  }
}

/**
 * Get user's resume
 * @param {string} userId - User ID
 * @returns {object|null} Resume document or null if not found
 */
async function getResume(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new AppError('Invalid user ID', 400, 'INVALID_USER_ID');
  }

  try {
    const resume = await Resume.findOne({ user: userId }).lean();
    
    if (!resume) {
      logger.debug(`No resume found for user ${userId}`);
      return null;
    }

    logger.info(`Resume fetched for user ${userId}`);
    return resume;
  } catch (error) {
    logger.error('Error fetching resume', {
      userId,
      message: error.message
    });
    throw error;
  }
}

/**
 * Improve resume using AI with ATS optimization
 * @param {object} data - Resume data to improve
 * @returns {object} Improved resume with better formatting and keywords
 */
async function improveResume(data) {
  // Input validation
  if (!data || typeof data !== 'object') {
    throw new AppError('Resume data is required for improvement', 400, 'INVALID_DATA');
  }

  if (Object.keys(data).length === 0) {
    throw new AppError('Resume cannot be empty', 400, 'EMPTY_RESUME');
  }

  try {
    const prompt = `
Improve this resume to be ATS optimized and more impactful.

Return FULL JSON response with this structure:
{
  "name": "",
  "summary": "",
  "skills": [],
  "projects": [],
  "experience": [],
  "education": []
}

Improvement Rules:
- Use strong action verbs (Led, Implemented, Designed, etc.)
- Add quantifiable metrics (%, numbers, amounts)
- Optimize for ATS by using industry keywords
- Improve bullet point clarity and impact
- Keep professional and concise
- Maintain all existing information

Original Resume:
${JSON.stringify(data, null, 2)}
`;

    logger.info('Starting AI resume improvement');
    const startTime = Date.now();

    const text = await generateAI(prompt);

    if (!text) {
      logger.warn('AI returned empty response');
      return data; // Fallback to original
    }

    const parsed = safeParseJSON(text);

    if (!parsed) {
      logger.warn('Could not parse AI response', { response: text });
      return data; // Fallback to original
    }

    logger.metric('AI Resume Improvement', Date.now() - startTime);
    return parsed;
  } catch (error) {
    logger.error('Error improving resume', {
      message: error.message,
      errorCode: error.errorCode
    });
    throw error;
  }
}

/**
 * Analyze resume for ATS compatibility and job matching
 * @param {object} data - Resume and optional job description
 * @returns {object} Analysis with scores and recommendations
 */
async function analyzeResume(data) {
  // Input validation
  if (!data || typeof data !== 'object') {
    throw new AppError('Resume data is required for analysis', 400, 'INVALID_DATA');
  }

  if (!data.resume) {
    throw new AppError('Resume object is required', 400, 'MISSING_RESUME');
  }

  try {
    logger.info('Starting resume analysis');
    const startTime = Date.now();

    const analysis = await analyzeATS({
      resume: data.resume,
      jobDescription: data.jobDescription || null
    });

    if (!analysis) {
      throw new AppError('Analysis failed', 500, 'ANALYSIS_FAILED');
    }

    logger.metric('Resume Analysis', Date.now() - startTime);
    
    return {
      ...analysis,
      analyzedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error analyzing resume', {
      message: error.message,
      errorCode: error.errorCode
    });
    throw error;
  }
}

module.exports = {
  saveResume,
  getResume,
  improveResume,
  generateResumePDF,
  analyzeResume
};
