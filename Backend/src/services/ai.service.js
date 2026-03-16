const {GoogleGenAI} = require("@google/genai");
const {z} = require ("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const { recompileSchema } = require("../Models/InterViewReports.models");

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
    })).describe("A day-wise preparation plan for the candidate")
})

async function generateInterviewReport({resume, selfDescription,jobDescription}) {

  const prompt =  `Generate an interview report for a candidate with the following details
  Resume: ${resume}
  Self Description : ${selfDescription}
  Job Description : ${jobDescription}
  `

  const response = await ai.models.generateContent({
    model:"gemini-2.5-flash",
    contents: prompt,
    config:{
      responseMimeType:"application/json",
      responseJsonSchema:zodToJsonSchema(interviewReportSchema),
    }
  })

  console.log(JSON.parse(response.text))
}

module.exports = generateInterviewReport;