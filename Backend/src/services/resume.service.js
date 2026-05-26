const Resume = require("../Models/resume.model");
const {safeParseJSON } = require("./ai.service");
const { generateAI } = require("./ai.engine");
const { ResumeSchema } = require("../validators/resume.validator");
const { normalizeResume } = require("../utils/normalizeResume");
const{analyzeATS} = require("./ats.service");
const {generateResumePDF} = require("./pdf.service");
async function saveResume(userId, data) {

  // ✅ STEP 1 NORMALIZE
  const normalized =
    normalizeResume(data);

  // ✅ STEP 2 VALIDATE
  const validated =
    ResumeSchema.parse(normalized);

  // ✅ STEP 3 UPSERT
  let resume =
    await Resume.findOne({
      user: userId
    });

  if (resume) {

    resume.set(validated);

    await resume.save();

  } else {

    resume =
      await Resume.create({
        user: userId,
        ...validated
      });
  }

  return resume;
}

// 🔥 GET USER RESUME
async function getResume(userId) {
  return await Resume.findOne({ user: userId }).lean(); // ✅ performance
}

// 🔥 AI IMPROVE
async function improveResume(data) {
  const prompt = `
Improve this resume to be ATS optimized.

Return FULL JSON:

{
  "name": "",
  "summary": "",
  "skills": [],
  "projects": [],
  "experience": [],
  "education": []
}

Rules:
- improve bullet points with impact
- use action verbs
- add metrics (%, numbers)
- optimize for ATS keywords

Resume:
${JSON.stringify(data)}
`;

  const text = await generateAI(prompt);

  const parsed = safeParseJSON(text); // ✅ SAFE PARSE

  return parsed || data;
}

async function analyzeResume(
  data
) {

  return await analyzeATS({
    resume: data.resume,
    jobDescription:
      data.jobDescription
  });
}
module.exports = {
  saveResume,
  getResume,
  improveResume,
  generateResumePDF,
  analyzeResume
};
