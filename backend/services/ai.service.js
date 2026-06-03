const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

// Lazy-initialized: avoids startup warning when GOOGLE_GENAI_API_KEY is not yet set
let _ai = null
function getAiClient() {
    if (!_ai) {
        if (!process.env.GOOGLE_GENAI_API_KEY) {
            throw new Error("GOOGLE_GENAI_API_KEY is not set in environment variables.")
        }
        _ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })
    }
    return _ai
}

// ── Zod Schemas (defined at module scope — not re-created per call) ────────────

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job description"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question that can be asked in the interview"),
        intention: z.string().describe("The intention of the interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question that can be asked in the interview"),   // Fixed: was incorrectly labelled "technical"
        intention: z.string().describe("The intention of the interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap — how important is this skill for the job")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day")
    })).describe("A day-wise preparation plan for the candidate to follow to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

const resumePdfSchema = z.object({
    html: z.string().describe("The HTML content of the resume which can be converted to PDF using puppeteer")
})

// ── AI Functions ──────────────────────────────────────────────────────────────

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    try {
        const prompt = `Generate an interview report for a candidate with the following details:
                            Resume: ${resume}
                            Self Description: ${selfDescription}
                            Job Description: ${jobDescription}
`
        const response = await getAiClient().models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(interviewReportSchema),
            }
        })

        return JSON.parse(response.text)
    } catch (err) {
        console.error("generateInterviewReport AI error:", err)
        throw new Error("Failed to generate interview report from AI.")
    }
}


async function generatePdfFromHtml(htmlContent) {
    // Safe args required for Linux/server environments; harmless on Windows
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    })

    try {
        const page = await browser.newPage()
        await page.setContent(htmlContent, { waitUntil: "networkidle0" })

        const pdfBuffer = await page.pdf({
            format: "A4",
            margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        })

        return pdfBuffer
    } finally {
        // Always close browser even if PDF generation fails
        await browser.close()
    }
}


async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    try {
        const prompt = `Generate resume for a candidate with the following details:
                            Resume: ${resume}
                            Self Description: ${selfDescription}
                            Job Description: ${jobDescription}

                            The response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using puppeteer.
                            The resume should be tailored for the given job description and highlight the candidate's strengths and relevant experience. The HTML should be well-formatted and visually appealing.
                            The content should NOT sound AI-generated and should be as close as possible to a real human-written resume.
                            You can use colors and different font styles but the overall design should be simple and professional.
                            The content should be ATS-friendly — easily parsable by ATS systems without losing important information.
                            The resume should ideally be 1-2 pages long when converted to PDF. Focus on quality over quantity.
                        `

        const response = await getAiClient().models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(resumePdfSchema),
            }
        })

        const jsonContent = JSON.parse(response.text)
        const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

        return pdfBuffer
    } catch (err) {
        console.error("generateResumePdf error:", err)
        throw new Error("Failed to generate resume PDF.")
    }
}

module.exports = { generateInterviewReport, generateResumePdf }