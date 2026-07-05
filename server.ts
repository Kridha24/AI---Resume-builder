import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const PORT = 3000;

// Initialize GoogleGenAI client (only if key exists to prevent crash)
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini AI client successfully initialized server-side.");
} else {
  console.warn("Warning: GEMINI_API_KEY environment variable is not defined. AI helper features will be disabled.");
}

async function startServer() {
  const app = express();

  // JSON parsing middleware
  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", aiEnabled: !!ai });
  });

  // AI Endpoint: Enhance resume bullet points
  app.post("/api/ai/enhance-bullet", async (req: any, res: any) => {
    const { bullet, role, company } = req.body;
    if (!bullet) {
      return res.status(400).json({ error: "Bullet point text is required" });
    }

    if (!ai) {
      return res.status(503).json({ error: "AI services are not configured. Please add GEMINI_API_KEY in Secrets." });
    }

    try {
      const prompt = `You are an expert resume writer and career coach. Your task is to rewrite a resume bullet point to make it extremely professional, high-impact, and metrics-oriented using strong action verbs.
      
      Current Role: ${role || "Professional"}
      ${company ? `Company: ${company}` : ""}
      Original Bullet Point: "${bullet}"
      
      Generate exactly 3 enhanced, professional alternatives. They must:
      1. Start with a strong action verb (e.g., Spearheaded, Orchestrated, Optimized, Designed, Consolidated, Pioneered, Modernized, Directed).
      2. Focus on achievements, outcomes, or business impact. Add realistic placeholder metrics in brackets like [15%] or [$50K] if applicable to serve as guidelines for the user.
      3. Be concise and polished.
      
      Return the response as a JSON array of 3 strings. Example format:
      [
        "Spearheaded the redesign of the core dashboard, improving user engagement by [15%] and reducing loading times by [2.5s].",
        "Optimized database queries for the main web application, resulting in a [30%] decrease in server response latency.",
        "Collaborated with cross-functional teams to deploy [three] major feature updates, enhancing system reliability by [99.9%]."
      ]
      
      Do not include any Markdown tags, code block wraps like \`\`\`json, or introductory text. Return only the raw JSON array.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "[]";
      let enhancedBullets = [];
      try {
        enhancedBullets = JSON.parse(text);
      } catch (parseErr) {
        // Fallback split if JSON parsing fails
        enhancedBullets = text
          .split("\n")
          .map(line => line.replace(/^[-*\d.\s"']+|["'\s]+$/g, "").trim())
          .filter(Boolean)
          .slice(0, 3);
      }

      res.json({ enhancedBullets });
    } catch (error: any) {
      console.error("AI Enhance Bullet Error:", error);
      res.status(500).json({ error: error.message || "Failed to enhance bullet point." });
    }
  });

  // AI Endpoint: Generate professional resume summary
  app.post("/api/ai/generate-summary", async (req: any, res: any) => {
    const { jobTitle, skills } = req.body;
    if (!jobTitle) {
      return res.status(400).json({ error: "Job title is required." });
    }

    if (!ai) {
      return res.status(503).json({ error: "AI services are not configured. Please add GEMINI_API_KEY in Secrets." });
    }

    try {
      const skillsText = skills && skills.length > 0 ? `with expertise in ${skills.join(", ")}` : "";
      const prompt = `You are a professional executive recruiter. Write a compelling, high-impact professional summary (3-4 sentences, about 60-80 words) for a resume.
      
      Job Title: ${jobTitle}
      Skills: ${skillsText}
      
      The summary should:
      1. Highlight key strengths, passion, and years of experience (use a generic "highly skilled" or customizable "[X] years" placeholder).
      2. Mention the ability to drive business results, solve complex problems, and collaborate with teams.
      3. Use formal, professional, modern tone. Avoid clichés.
      
      Return only the clean summary text. Do not put quotes around it or add any label or intro text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const summary = response.text?.trim() || "";
      res.json({ summary });
    } catch (error: any) {
      console.error("AI Generate Summary Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate professional summary." });
    }
  });

  // AI Endpoint: Refine/Smart Refine professional summary
  app.post("/api/ai/refine-summary", async (req: any, res: any) => {
    const { summary, jobTitle } = req.body;
    if (!summary) {
      return res.status(400).json({ error: "Summary text is required for refinement." });
    }

    if (!ai) {
      return res.status(503).json({ error: "AI services are not configured. Please add GEMINI_API_KEY in Secrets." });
    }

    try {
      const prompt = `You are an expert resume writer and executive career coach. Refine the following professional summary to elevate its professional impact, use stronger and more persuasive action verbs, and adjust the tone to fit a candidate targeting a "${jobTitle || 'Professional'}" role.

Original Summary:
"${summary}"

Your refined version should:
1. Keep the overall core background, but replace weaker phrasing with strong, dynamic action verbs and precise corporate vocabulary.
2. Ensure the tone is elegant, professional, confident, and results-oriented.
3. Keep it to a cohesive, polished paragraph of 3-4 sentences (approx. 60-90 words).
4. Do not include introductory text, explanations, or quotes. Return only the refined summary text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const refinedSummary = response.text?.trim() || "";
      res.json({ refinedSummary });
    } catch (error: any) {
      console.error("AI Refine Summary Error:", error);
      res.status(500).json({ error: error.message || "Failed to refine professional summary." });
    }
  });

  // AI Endpoint: Suggest standard skills for job title
  app.post("/api/ai/suggest-skills", async (req: any, res: any) => {
    const { jobTitle } = req.body;
    if (!jobTitle) {
      return res.status(400).json({ error: "Job title is required." });
    }

    if (!ai) {
      return res.status(503).json({ error: "AI services are not configured. Please add GEMINI_API_KEY in Secrets." });
    }

    try {
      const prompt = `Provide a list of 12 relevant, high-impact professional skills for a person working as a "${jobTitle}".
      Include both technical/hard skills and vital soft skills. Keep each skill short and elegant (1 to 3 words max).
      
      Return the response as a JSON array of strings. Example:
      ["React", "TypeScript", "State Management", "CI/CD", "UI/UX Design", "REST APIs", "Team Collaboration", "Problem Solving", "Agile Methodology", "Git"]
      
      Do not include any Markdown tags, code block wraps like \`\`\`json, or introductory text. Return only the raw JSON array.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "[]";
      let suggestedSkills = [];
      try {
        suggestedSkills = JSON.parse(text);
      } catch (parseErr) {
        suggestedSkills = text
          .split("\n")
          .map(line => line.replace(/^[-*\d.\s"']+|["'\s]+$/g, "").trim())
          .filter(Boolean)
          .slice(0, 12);
      }

      res.json({ skills: suggestedSkills });
    } catch (error: any) {
      console.error("AI Suggest Skills Error:", error);
      res.status(500).json({ error: error.message || "Failed to suggest skills." });
    }
  });

  // AI Endpoint: Parse existing raw resume text or files into ResumeData structure
  app.post("/api/ai/parse-resume", async (req: any, res: any) => {
    const { rawText, fileBase64, mimeType } = req.body;
    
    if (!rawText && !fileBase64) {
      return res.status(400).json({ error: "Resume raw text or uploaded file is required for parsing." });
    }

    if (!ai) {
      return res.status(503).json({ error: "AI services are not configured. Please add GEMINI_API_KEY in Secrets." });
    }

    try {
      const systemInstruction = `You are an advanced, precise resume parsing engine. Your goal is to analyze the provided candidate resume content (whether raw text or an uploaded file) and extract all its content into a highly accurate, clean, structured JSON object matching the defined structure.
      
Please parse the text/file and structure it exactly as follow:
{
  "personalInfo": {
    "fullName": "Extracted Full Name (or empty string)",
    "jobTitle": "Extracted target or most recent professional Job Title",
    "email": "Extracted email address",
    "phone": "Extracted phone number",
    "location": "City, State or Country",
    "website": "Personal website or portfolio URL",
    "linkedin": "LinkedIn profile link or username",
    "github": "GitHub link or username"
  },
  "summary": "A clean, executive, 3-4 sentence professional summary summarizing their background and expertise.",
  "workExperience": [
    {
      "id": "exp-1",
      "company": "Company Name",
      "position": "Job Title",
      "location": "City, State",
      "startDate": "Start Date (e.g., MM/YYYY or Month YYYY)",
      "endDate": "End Date or Present",
      "current": true/false (true if present/current),
      "description": ["Core bullet point 1", "Core bullet point 2"]
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "institution": "University/Institution Name",
      "degree": "Degree (e.g., Bachelor of Science)",
      "fieldOfStudy": "Major or field of study",
      "location": "City, State",
      "startDate": "Start Date",
      "endDate": "Graduation Date",
      "current": false,
      "gpa": "GPA if mentioned"
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "title": "Project Name",
      "role": "Role in the project",
      "technologies": ["React", "TypeScript"],
      "link": "Project URL or source code link",
      "description": ["Key contribution or outcome 1", "Key contribution or outcome 2"]
    }
  ],
  "skills": [
    {
      "id": "skill-1",
      "name": "Skill Category Name (e.g., Frontend, Backend, Cloud & Tools)",
      "skills": ["Skill 1", "Skill 2"]
    }
  ],
  "languages": ["Language 1", "Language 2"],
  "certifications": ["Certification 1", "Certification 2"],
  "customSection": {
    "title": "Custom Achievements",
    "content": "",
    "show": false
  }
}

Do not include any wrapper lines, markdown code fences, or explanations. Return only valid, parseable JSON conforming to this schema. Use empty string or empty array for fields that are missing in the document. Ensure every item in workExperience, education, projects, and skills has a unique ID string like 'exp-1', 'exp-2', etc.`;

      let contents: any;
      if (fileBase64 && mimeType) {
        contents = [
          {
            inlineData: {
              data: fileBase64,
              mimeType: mimeType
            }
          },
          {
            text: `${systemInstruction}\n\nParse the attached document file strictly according to the guidelines.`
          }
        ];
      } else {
        contents = `${systemInstruction}\n\nRaw Resume Text:\n"""\n${rawText}\n"""`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text?.trim() || "{}";
      const parsedResume = JSON.parse(responseText);
      res.json({ parsedResume });
    } catch (error: any) {
      console.error("AI Parse Resume Error:", error);
      res.status(500).json({ error: error.message || "Failed to parse resume text." });
    }
  });

  // AI Endpoint: Generate Cover Letter
  app.post("/api/ai/generate-cover-letter", async (req: any, res: any) => {
    const { fullName, targetRole, summary, skillsList, jobDescription } = req.body;

    if (!ai) {
      return res.status(503).json({ error: "AI services are not configured. Please add GEMINI_API_KEY in Secrets." });
    }

    try {
      const prompt = `You are an elite, professional cover letter writer and executive recruiter. Write a pristine, persuasive, and highly customized cover letter for a candidate targeting the position of "${targetRole || 'Professional'}" based on this job description:
"""
${jobDescription || ''}
"""

Use the candidate's professional background and profile to write a formal, premium-grade cover letter:
Candidate Name: ${fullName || 'Candidate'}
Target Role: ${targetRole || 'Professional'}
Resume Summary: ${summary || ''}
Key Skills: ${skillsList || ''}

Structure the cover letter formally with:
1. Contact details header block (Today's Date, Candidate Info).
2. Salutation (e.g., Dear Hiring Team at target organization).
3. Opening paragraph: An attention-grabbing hook detailing why they are enthusiastic about this specific target role and how their background aligns.
4. Body paragraph(s): Select 2-3 powerful strengths or projects based on their background and link them directly to solving challenges described in the job description using results-driven, elegant corporate vocabulary.
5. Closing paragraph: A professional call-to-action expressing excitement for an interview, and a warm closing (e.g., "Sincerely,", followed by candidate name).

Keep the letter extremely focused, professional, and limited to 250-350 words. Write the output in clean, crisp markdown paragraphs (no markdown headers, just paragraphs) with standard line spacing. Return ONLY the cover letter.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const coverLetter = response.text?.trim() || "";
      res.json({ coverLetter });
    } catch (error: any) {
      console.error("AI Generate Cover Letter Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate cover letter." });
    }
  });

  // AI Endpoint: Career Coach conversational assistant
  app.post("/api/ai/chat", async (req: any, res: any) => {
    const { messages, context } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    if (!ai) {
      return res.status(503).json({ error: "AI services are not configured. Please add GEMINI_API_KEY in Secrets." });
    }

    try {
      // Build standard Gemini SDK contents structure
      // Prepend a system prompt to the user instructions or context
      const currentResume = context?.resumeData || {};
      const currentCoverLetter = context?.coverLetter || "None currently written";

      const systemContext = `You are "Resumify Career Coach", a professional resume optimizer and executive recruiter. Your objective is to help the candidate with actionable suggestions, perfect verbs, phrasing, and templates.

Here is the candidate's current Resume Profile:
- Full Name: ${currentResume.personalInfo?.fullName || "Unspecified"}
- Target Job: ${currentResume.personalInfo?.jobTitle || "Unspecified"}
- Summary Statement: ${currentResume.summary || "None provided yet"}
- Skills Matrix: ${JSON.stringify(currentResume.skills || [])}
- Work Experience Bullet points: ${JSON.stringify(currentResume.workExperience || [])}
- Projects List: ${JSON.stringify(currentResume.projects || [])}

Current Cover Letter text in the session:
"""
${currentCoverLetter}
"""

Guidelines for you:
1. Provide highly specific, ready-to-use resume bullet points, cover letter paragraphs, or tailored skill groupings.
2. Maintain an encouraging, precise, and professional executive tone.
3. Be brief and structurally clear (use bolding and lists).
4. Do not talk about JSON schemas or code unless asked. Respond naturally.`;

      // We map the incoming client messages to the @google/genai SDK format
      // Gemini Flash model: we can pass system instruction or combine it in a prompt
      const geminiContents = [
        {
          role: "user",
          parts: [{ text: systemContext }]
        },
        ...messages.map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }]
        }))
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: geminiContents,
      });

      const reply = response.text?.trim() || "";
      res.json({ reply });
    } catch (error: any) {
      console.error("AI Career Coach Chat Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI Coach response." });
    }
  });

  // AI Endpoint: ATS Resume Review and ATM Level optimization
  app.post("/api/ai/ats-review", async (req: any, res: any) => {
    const { resumeData, jobDescription } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: "Resume data is required." });
    }

    if (!ai) {
      return res.status(503).json({ error: "AI services are not configured. Please add GEMINI_API_KEY in Secrets." });
    }

    const hasJobDesc = !!jobDescription && jobDescription.trim().length > 0;

    try {
      let promptText = "";
      
      if (hasJobDesc) {
        promptText = `You are "ATS Match Expert (ATM System)". Analyze the provided candidate resume data against the specific Target Job Description pasted below.
Rate how well the candidate's profile matches the requirements of the job description on a strict scale from 1 to 10 (score), and calculate a detailed percentage match score (0-100%) based on required skills, experience, and educational alignment.

Target Job Description:
${jobDescription}

Candidate Resume Profile to evaluate:
- Full Name: ${resumeData.personalInfo?.fullName || "Unspecified"}
- Target Role/Title: ${resumeData.personalInfo?.jobTitle || "Unspecified"}
- Summary Statement: ${resumeData.summary || "None provided yet"}
- Skills: ${JSON.stringify(resumeData.skills || [])}
- Work Experience: ${JSON.stringify(resumeData.workExperience || [])}
- Projects: ${JSON.stringify(resumeData.projects || [])}
- Education: ${JSON.stringify(resumeData.education || [])}

Perform an in-depth review of the resume content against this job description. Provide your assessment in EXACTLY the following JSON schema format:
{
  "score": 7, // integer rating from 1 to 10 for overall resume quality
  "scoreExplanation": "Summary of current ATS/ATM performance, specific strengths regarding this job description, and alignment.",
  "feedback": [
    {
      "category": "Action Verbs & Impact", // Category name
      "description": "Analysis of current bullet points or text issues in this category relative to this job.",
      "howToFix": "Specific recommendations of what word/phrase to change, where to change it, and what to replace it with to align with this job."
    }
  ],
  "suggestedKeywords": ["Keyword1", "Keyword2"], // 5-8 highly relevant industry keywords or tools from the job description the user should explicitly list
  "atsTips": [
    "Tip on formatting or structuring that will make this resume more parser-friendly."
  ],
  "matchScore": 75, // Integer from 0 to 100 representing the exact match percentage against this job description
  "matchingKeywords": ["Skill1", "Skill2"], // Critical skills/keywords in both the resume and the job description (contextually matched)
  "missingKeywords": ["Skill3", "Skill4"] // Crucial skills/keywords mentioned in the job description but missing or weak in the resume
}

Ensure the output is valid, raw JSON ONLY. Do not write any markdown codeblocks or conversational text around the JSON. Begin the response with "{" and end with "}".`;
      } else {
        promptText = `You are "ATS Match Expert (ATM System)". Analyze the provided candidate resume data and rate it on a strict scale from 1 to 10 based on standard recruiter screening guidelines, keyword match metrics, action verb usage, and layout-readability rules.

Candidate Resume Profile to evaluate:
- Full Name: ${resumeData.personalInfo?.fullName || "Unspecified"}
- Target Role/Title: ${resumeData.personalInfo?.jobTitle || "Unspecified"}
- Summary Statement: ${resumeData.summary || "None provided yet"}
- Skills: ${JSON.stringify(resumeData.skills || [])}
- Work Experience: ${JSON.stringify(resumeData.workExperience || [])}
- Projects: ${JSON.stringify(resumeData.projects || [])}
- Education: ${JSON.stringify(resumeData.education || [])}

Perform an in-depth review of the resume content. Provide your assessment in EXACTLY the following JSON schema format:
{
  "score": 7, // integer rating from 1 to 10
  "scoreExplanation": "Summary of current ATS/ATM performance and strengths.",
  "feedback": [
    {
      "category": "Action Verbs & Impact", // Category name
      "description": "Analysis of current bullet points or text issues in this category.",
      "howToFix": "Specific recommendations of what word/phrase to change, where to change it, and what to replace it with to hit ATM Level."
    }
  ],
  "suggestedKeywords": ["Keyword1", "Keyword2"], // 5-8 highly relevant industry keywords or tools the user should explicitly list
  "atsTips": [
    "Tip on formatting or structuring that will make this resume more parser-friendly."
  ]
}

Ensure the output is valid, raw JSON ONLY. Do not write any markdown codeblocks or conversational text around the JSON. Begin the response with "{" and end with "}".`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: promptText }]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text?.trim() || "{}";
      
      // Attempt to parse the response as JSON. If it fails, return a safe fallback.
      try {
        const parsedResult = JSON.parse(responseText);
        res.json(parsedResult);
      } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON. Raw text was:", responseText);
        // Fallback response with basic structured feedback
        const fallback: any = {
          score: 6,
          scoreExplanation: "Your resume has a solid base but needs optimized metrics and keywords.",
          feedback: [
            {
              category: "Action Verbs & Impact",
              description: "Work experience lacks numbers, scale, or metrics.",
              howToFix: "Include metrics such as 'increased speed by 25%' or 'saved 10+ hours weekly' to hit top ATS levels."
            },
            {
              category: "Keywords & Skills",
              description: "Missed essential industry tools or high-value frameworks.",
              howToFix: "Integrate more target terms (e.g. cloud deployments, agile methodologies) into your skills block."
            }
          ],
          suggestedKeywords: ["TypeScript", "Agile Methodologies", "Cloud Architecture", "REST APIs"],
          atsTips: ["Use simple, parser-friendly single-column layout hierarchies."]
        };
        if (hasJobDesc) {
          fallback.matchScore = 60;
          fallback.matchingKeywords = ["TypeScript", "REST APIs"];
          fallback.missingKeywords = ["Agile Methodologies", "Cloud Architecture"];
        }
        res.json(fallback);
      }
    } catch (error: any) {
      console.error("ATS Review Error:", error);
      res.status(500).json({ error: error.message || "Failed to process resume review." });
    }
  });

  // AI Endpoint: Translate whole resume into selected target language
  app.post("/api/ai/translate-resume", async (req: any, res: any) => {
    const { resumeData, targetLanguage } = req.body;
    if (!resumeData || !targetLanguage) {
      return res.status(400).json({ error: "Resume data and target language are required for translation." });
    }

    if (!ai) {
      return res.status(503).json({ error: "AI services are not configured. Please add GEMINI_API_KEY in Secrets." });
    }

    try {
      const prompt = `You are a professional multi-language corporate translator specializing in professional resumes/CVs. 
Translate the following ResumeData JSON structure into the specified target language: "${targetLanguage}".

You MUST return a JSON object with the exact same keys and structure, but all text values translated into "${targetLanguage}".
Keep personal names, URLs, phone numbers, emails, dates (months, years like 2021), and common non-translatable technology terms (e.g. React, SQL, Java, AWS, TypeScript) in their original form.
Translate job titles, bullet points, skills categories, descriptions, custom headings, and professional summaries.

Input JSON:
${JSON.stringify(resumeData, null, 2)}

Return ONLY valid RAW JSON. Do not put markdown codeblocks or conversational text around the JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text?.trim() || "{}";
      const translatedResume = JSON.parse(responseText);
      res.json({ translatedResume });
    } catch (error: any) {
      console.error("AI Translate Resume Error:", error);
      res.status(500).json({ error: error.message || "Failed to translate resume." });
    }
  });

  // AI Endpoint: Tailor resume to a job description
  app.post("/api/ai/tailor-resume", async (req: any, res: any) => {
    const { resumeData, jobDescription } = req.body;
    if (!resumeData || !jobDescription) {
      return res.status(400).json({ error: "Resume data and job description are required for tailoring." });
    }

    if (!ai) {
      return res.status(503).json({ error: "AI services are not configured. Please add GEMINI_API_KEY in Secrets." });
    }

    try {
      const prompt = `You are an expert executive resume writer. Your task is to tailor the candidate's professional summary based on the target job description.
Original Summary: "${resumeData.summary || ''}"
Target Job Description:
"""
${jobDescription}
"""

Also identify 5-8 highly relevant keywords or skills from the job description that the candidate should add.

Return the response as RAW JSON only conforming to this schema:
{
  "tailoredSummary": "A compelling, customized professional summary highlighting relevant experience aligned with the job description.",
  "suggestedSkills": ["Skill 1", "Skill 2", "Skill 3"]
}

Do not include markdown codeblocks or intro/outro text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text?.trim() || "{}";
      const result = JSON.parse(responseText);
      res.json(result);
    } catch (error: any) {
      console.error("AI Tailor Resume Error:", error);
      res.status(500).json({ error: error.message || "Failed to tailor resume." });
    }
  });

  // AI Endpoint: Audit resume for clichés and weak words
  app.post("/api/ai/audit-cliche", async (req: any, res: any) => {
    const { resumeData } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: "Resume data is required for auditing." });
    }

    if (!ai) {
      return res.status(503).json({ error: "AI services are not configured. Please add GEMINI_API_KEY in Secrets." });
    }

    try {
      const prompt = `You are a professional resume reviewer. Scan the candidate's resume summary and work experience bullet points for cliché, overused, weak, or passive words/phrases (e.g. "responsible for", "hardworking", "team player", "utilize", "go-to guy", "synergy", "innovative", "expert", "results-driven").
Identify up to 6 instances of weak phrasing. For each instance, suggest a high-impact, active replacement and explain why.

Resume Data:
Summary: "${resumeData.summary || ''}"
Experience Bullets:
${JSON.stringify((resumeData.workExperience || []).map((exp: any) => ({ company: exp.company, bullets: exp.description })), null, 2)}

Return the results as a RAW JSON array ONLY matching this structure:
{
  "findings": [
    {
      "id": "find-1",
      "phrase": "responsible for",
      "text": "The sentence containing the weak phrase",
      "replacement": "Spearheaded, Orchestrated, or Led",
      "explanation": "Using 'responsible for' is passive. Replace it with an active verb that highlights ownership and initiative."
    }
  ]
}

Return ONLY valid JSON. No markdown tags or conversational text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text?.trim() || "{}";
      const result = JSON.parse(responseText);
      res.json(result);
    } catch (error: any) {
      console.error("AI Audit Cliche Error:", error);
      res.status(500).json({ error: error.message || "Failed to audit clichés." });
    }
  });

  // AI Endpoint: Analyze skill gap against target job description
  app.post("/api/ai/skill-gap", async (req: any, res: any) => {
    const { resumeData, jobTitle, jobDescription } = req.body;
    if (!resumeData || !jobTitle || !jobDescription) {
      return res.status(400).json({ error: "Resume data, target job title, and job description are required." });
    }

    if (!ai) {
      return res.status(503).json({ error: "AI services are not configured. Please add GEMINI_API_KEY in Secrets." });
    }

    try {
      const allResumeSkills = (resumeData.skills || []).flatMap((cat: any) => cat.skills || []);
      const prompt = `You are an ATS skills gap specialist. Compare the candidate's active list of skills against the requirements for a "${jobTitle}" using this job description:
"""
${jobDescription}
"""

Candidate Current Skills: ${JSON.stringify(allResumeSkills)}

Identify:
1. Matching skills: Skills in their resume that align well with the job description.
2. Missing skills: 5-8 high-priority skill/technology/tool names that appear in the job description but are absent or under-represented in the candidate's resume.
3. Recommended certifications/courses: 2 actual, recognized professional certifications or courses they can take to fill the gap (e.g. AWS Certified Developer, Certified ScrumMaster, etc.)

Return raw JSON only conforming to this structure:
{
  "matchingSkills": ["Skill 1", "Skill 2"],
  "missingSkills": ["Missing Skill A", "Missing Skill B"],
  "recommendedCertifications": ["Cert 1", "Cert 2"]
}

No markdown wraps or conversational intro/outro text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text?.trim() || "{}";
      const result = JSON.parse(responseText);
      res.json(result);
    } catch (error: any) {
      console.error("AI Skill Gap Error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze skills gap." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server mounted as middleware.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving production static assets from dist/");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
