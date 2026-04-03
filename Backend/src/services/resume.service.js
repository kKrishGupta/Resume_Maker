const Resume = require("../Models/resume.model");
const { generateResumePdf, safeParseJSON } = require("./ai.service");
const { generateAI } = require("./ai.engine");
// 🔥 CREATE / UPDATE
async function saveResume(userId, data) {
  let resume = await Resume.findOne({ user: userId });

  if (resume) {
    resume.set(data); // ✅ safer than Object.assign
    await resume.save();
  } else {
    resume = await Resume.create({ user: userId, ...data });
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

// 🔥 GENERATE PDF
async function generateResumePDF(data) {
  return await generateResumePdf(data);
}

async function analyzeResume(data) {
  const prompt = `
You are an ATS (Applicant Tracking System).

Analyze this resume and return JSON:

{
  "score": number,
  "keywords": ["missing keywords"],
  "suggestions": ["improvement suggestions"]
}

Rules:
- score between 0-100
- identify missing skills
- suggest improvements

Resume:
${JSON.stringify(data)}
`;

  const { generateAI } = require("./ai.engine");
  const { safeParseJSON } = require("./ai.service");

  const text = await generateAI(prompt);

  const parsed = safeParseJSON(text);

  return parsed || {
    score: 60,
    keywords: [],
    suggestions: []
  };
}
module.exports = {
  saveResume,
  getResume,
  improveResume,
  generateResumePDF,
  analyzeResume
};
