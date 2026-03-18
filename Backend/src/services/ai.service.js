const {GoogleGenAI} = require("@google/genai");
const {z} = require ("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const { recompileSchema } = require("../Models/InterViewReports.models");
const puppeteer = require("puppeteer")
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
});

const interviewReportSchema = z.object({
  matchScore:z.number().describe("A score between 0 and 100 indicating how well the candidate matches the job role"),

  technicalQuestion : z.array(z.object({
      question :z.string().describe("The technical question can be ask in the interview"),
      intention: z.string().describe("The intention of interviewer behind asking this question"),
      answer: z.string().describe("How to answer this question , what points to cover, what approach to take ")
    })).describe("Technical questions that can be asked in the interview along with their intention"),

  behavioralQuestions:z.array(z.object({
      question :z.string().describe("The technical question can be ask in the interview"),
      intention: z.string().describe("The intention of interviewer behind asking this question"),
      answer: z.string().describe("How to answer this question , what points to cover, what approach to take ")
    })).describe("Beavioural questions that can be asked in the interview along with their intention"),

  skillGaps:z.array(z.object({
      skill:z.string().describe("The skill which the candidate is lacking"),
      severity:z.enum(["low","medium","high"]).describe("The severity of this skill gap")
    })).describe("List of skill gaps in the candidate's profile"),

  preparationPlan : z.array(z.object({
      day:z.number().describe("The day number in the preparation plan"),
      focus:z.string().describe("The main focus of this day in the preparation plan"),
      tasks:z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation")
    })).describe("A day-wise preparation plan for the candidate"),
    title:z.string().describe("The title of the job for which the interview report is generated")
})

async function generateInterviewReport({resume, selfDescription,jobDescription}) {

const prompt = `
You are an expert technical interviewer and hiring manager.

Analyze the candidate profile and generate a COMPLETE interview preparation report.

IMPORTANT RULES:
- Return ONLY valid JSON
- Do NOT return text outside JSON
- Do NOT return strings where objects are required
- Follow the structure EXACTLY
- All arrays must contain OBJECTS, not strings

Candidate Resume:
${resume}

Candidate Self Description:
${selfDescription}

Job Description:
${jobDescription}

Return JSON in EXACTLY this format:

{
  "matchScore": number,

  "technicalQuestion": [
    {
      "question": "string",
      "intention": "string",
      "answer": "string"
    }
  ],

  "behavioralQuestions": [
    {
      "question": "string",
      "intention": "string",
      "answer": "string"
    }
  ],

  "skillGaps": [
    {
      "skill": "string",
      "severity": "low | medium | high"
    }
  ],

  "preparationPlan": [
    {
      "day": number,
      "focus": "string",
      "tasks": ["string"]
    }
  ]
}

Requirements:
- technicalQuestion → exactly 5 objects
- behavioralQuestions → exactly 3 objects
- preparationPlan → exactly 7 days
- matchScore → between 0 and 100
- severity must be ONLY: low, medium, or high

Do NOT return:
- plain strings
- missing fields
- extra fields

ONLY return valid JSON.
`;

let response; // ✅ define here
  let result;

  try {
    response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // ✅ better model
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: zodToJsonSchema(interviewReportSchema),
      }
    });

    if (!response.text) {
      throw new Error("Empty AI response");
    }

    result = JSON.parse(response.text);

  } catch (error) {
    console.error("❌ AI ERROR:", error.message);

    // ✅ now safe
    if (response && response.text) {
      console.error("❌ AI RAW RESPONSE:", response.text);
    }

    // ✅ fallback (prevents crash)
    return {
      matchScore: 50,
      technicalQuestion: [],
      behavioralQuestions: [],
      skillGaps: [],
      preparationPlan: []
    };
  }

  // ✅ sanitize (important)
  result.skillGaps = Array.isArray(result.skillGaps)
    ? result.skillGaps.map(item =>
        typeof item === "object"
          ? item
          : { skill: item, severity: "medium" }
      )
    : [];

  result.preparationPlan = Array.isArray(result.preparationPlan)
    ? result.preparationPlan.map((item, index) =>
        typeof item === "object"
          ? item
          : {
              day: index + 1,
              focus: item,
              tasks: [item]
            }
      )
    : [];

  return result;
}

async function generateFromHtml(htmlContent){
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent,{waitUntil : "networkidle0"})
  const pdfBuffer = await page.pdf({format:"A4"})
  await browser.close();
  return pdfBuffer
}

async function generateResumePdf({resume,selfDescription, }){
  const resumepdfSchema = z.object({
    html:z.string().describe("The html content of the resume which can be converted to using a library")
  })

  const prompt = `Generate a resume PDF for a candidate with the following Details:
  Resume : ${resume}
  Self Description : ${selfDescription}
  Job Description: ${jobDescription}
  
  the response should ne a json object with a single field using the data
  `
const response = await ai.models.generateContent({
  model:"gemini-2.5-flash-preview",
  contents : prompt,
  config:{
    responseMimeType : "application/json",
    responseSchema : zodToJsonSchem(resumepdfSchema)
  }
}) 
const jsonContent =  JSON.parse(response.text);

}
module.exports = {generateInterviewReport,generateFromHtml };