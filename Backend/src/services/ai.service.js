const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const pdf = require("html-pdf-node");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


const prompt = `
You are an expert technical interviewer.

CRITICAL INSTRUCTIONS (DO NOT BREAK):
- Return ONLY valid JSON
- DO NOT return text, explanation, markdown, or code blocks
- DO NOT return arrays of key-value pairs like ["key", value]
- ALWAYS return proper JSON objects
- Every array must contain ONLY objects (no strings, no mixed values)

STRICT JSON FORMAT (FOLLOW EXACTLY):

{
  "title": "string",
  "matchScore": number,

  "technicalQuestions": [
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

STRICT REQUIREMENTS:
- technicalQuestions → minimum 5 objects
- behavioralQuestions → minimum 3 objects
- skillGaps → minimum 3 objects
- preparationPlan → between 5 to 7 objects
- tasks MUST be an array of strings (NOT a single string)
- Each object must contain ALL required fields

FORBIDDEN OUTPUTS:
❌ ["day", 1, "focus", "..."]
❌ "technicalQuestions": ["question", "..."]
❌ stringified JSON
❌ missing fields
❌ null or undefined values

VALID OUTPUT EXAMPLE:
{
  "preparationPlan": [
    {
      "day": 1,
      "focus": "System Design",
      "tasks": ["Learn basics", "Practice problems"]
    }
  ]
}

Candidate Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)


}

async function generatePdfFromHtml(htmlContent) {
  try {
    const options = {
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm"
      }
    };

    const file = {
      content: htmlContent
    };

    const pdfBuffer = await pdf.generatePdf(file, options);

    return pdfBuffer;

  } catch (error) {
    console.error("❌ PDF GENERATION ERROR:", error);
    throw new Error("PDF generation failed");
  }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

const prompt = `
You are an expert resume writer.

CRITICAL RULES (VERY IMPORTANT):
- Return ONLY valid JSON
- Output must contain only one field: "html"
- Resume MUST fit EXACTLY ONE A4 page (no overflow, no second page)
- The page should look FULL and properly utilized (not too empty, not too crowded)

LAYOUT RULES:
- Use full A4 space effectively
- Maintain clean spacing and alignment
- Avoid excessive white space
- Avoid overly dense content

CONTENT GUIDELINES:
- Keep content concise but meaningful
- Do NOT overly shorten content
- Do NOT remove important achievements
- Maintain strong impact

SECTION RULES:
- Summary: 2–3 lines (clear and strong)
- Skills: well-structured (1–2 lines, grouped if needed)
- Projects: 2 projects (each with 3–4 bullet points)
- Experience: 2–3 bullet points
- Achievements: 2–3 bullet points
- Education: concise

STYLE RULES:
- Bullet points should be short but descriptive
- Avoid long paragraphs
- Maintain readability (not too compressed)
- Professional and ATS-friendly format

HTML REQUIREMENTS:
- Wrap everything inside: <div class="page">
- Design must fit inside A4 (210mm × 297mm)
- No overflow outside the page
- No page breaks

VISUAL BALANCE:
- The resume should look visually balanced
- Fill the page properly (no large empty gaps)
- Maintain consistent spacing between sections

OUTPUT FORMAT:
{
  "html": "<complete HTML document>"
}

Candidate Resume:
${resume}

Job Description:
${jobDescription}

Self Description:
${selfDescription}
`;

try {

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(resumePdfSchema),
      }
    });

    let text = response.text;

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let jsonContent;

    try {
      jsonContent = JSON.parse(text);
    } catch (err) {
      console.error("❌ JSON PARSE ERROR:", text);
      throw new Error("Invalid JSON from AI");
    }

    if (!jsonContent.html) {
      throw new Error("HTML not generated");
    }

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

    return pdfBuffer;

  } catch (err) {
    console.error("❌ SERVICE ERROR:", err);
    throw err;
  }


}

// 🔥 generate more technical questions
async function generateAIQuestions({ jobDescription, resume, previousQuestions }) {
  try {
    const prompt = `
You are an expert interviewer.

Generate 5 NEW technical interview questions.

STRICT RULES:
- Do NOT repeat previous questions
- Return ONLY JSON
- No explanation, no text

FORMAT:
[
  {
    "question": "string",
    "intention": "string",
    "answer": "string"
  }
]

Previous Questions:
${previousQuestions.map(q => q.question).join("\n")}

Job Description:
${jobDescription}

Resume:
${resume}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    let text = response.text;

    // 🔥 CLEAN RESPONSE
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("❌ JSON PARSE ERROR:", text);
      return [];
    }

    return parsed;

  } catch (err) {
    console.error("AI question error:", err);
    return [];
  }
}

async function generateAIBehavioralQuestions({ jobDescription, previousQuestions }) {
  try {
    const prompt = `
You are an expert interviewer.

Generate 5 NEW behavioral interview questions.

Avoid repeating:
${previousQuestions.map(q => q.question).join("\n")}

Return JSON only:

[
 {
   "question": "",
   "intention": "",
   "answer": ""
 }
]
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    let text = response.text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(text);

  } catch (err) {
    console.error("Behavioral AI error:", err);
    return [];
  }
}
module.exports = { generateInterviewReport, generateResumePdf ,generateAIQuestions,generateAIBehavioralQuestions};