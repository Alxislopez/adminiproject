import type { Subject, ClassificationResult, GrokMessage, GrokResponse } from "@/types";

// Using Groq API (FREE tier) - https://console.groq.com
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function generateKeywords(syllabus: string): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  if (!syllabus || syllabus.trim().length < 10) {
    return [];
  }

  const messages: GrokMessage[] = [
    {
      role: "system",
      content: `You are a keyword extraction assistant. Given a course syllabus or subject description, extract the most important keywords and topics that would help identify documents related to this subject.

Rules:
- Extract 10-20 relevant keywords/phrases
- Focus on technical terms, concepts, topics, and important themes
- Include both specific terms and broader categories
- Keywords should be lowercase
- Return ONLY a JSON array of strings, nothing else

Example output: ["machine learning", "neural networks", "deep learning", "classification", "regression"]`,
    },
    {
      role: "user",
      content: `Extract keywords from this syllabus:\n\n${syllabus.substring(0, 3000)}`,
    },
  ];

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data: GrokResponse = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    return [];
  }

  try {
    // Extract JSON array from response
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      return [];
    }
    
    const keywords = JSON.parse(arrayMatch[0]) as string[];
    return keywords.filter((k) => typeof k === "string" && k.trim().length > 0);
  } catch {
    return [];
  }
}

export async function classifyDocument(
  text: string,
  subjects: Subject[]
): Promise<ClassificationResult> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  if (subjects.length === 0) {
    throw new Error("No subjects configured for classification");
  }

  const subjectList = subjects
    .map((s) => `- ${s.name} (id: ${s.id}): ${s.description || "No description"} (keywords: ${s.keywords.join(", ")})`)
    .join("\n");

  const messages: GrokMessage[] = [
    {
      role: "system",
      content: `You are a document classification assistant. Given a document's text content and a list of subject categories, determine which category best fits the document.

Available subjects:
${subjectList}

Respond in JSON format only:
{
  "subjectId": "the_subject_id",
  "subjectName": "the_subject_name", 
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

If no subject matches well (confidence < 0.3), use the first available subject as default.`,
    },
    {
      role: "user",
      content: `Classify this document:\n\n${text.substring(0, 4000)}`,
    },
  ];

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant", // Free, fast model
      messages,
      temperature: 0.1,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data: GrokResponse = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from Grok API");
  }

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    
    const result = JSON.parse(jsonMatch[0]) as ClassificationResult;
    
    const validSubject = subjects.find(
      (s) => s.id === result.subjectId || s.name === result.subjectName
    );
    
    if (!validSubject) {
      return {
        subjectId: subjects[0].id,
        subjectName: subjects[0].name,
        confidence: 0.3,
        reasoning: "Default classification - no strong match found",
      };
    }

    return {
      ...result,
      subjectId: validSubject.id,
      subjectName: validSubject.name,
    };
  } catch {
    return {
      subjectId: subjects[0].id,
      subjectName: subjects[0].name,
      confidence: 0.3,
      reasoning: "Classification parsing failed - using default",
    };
  }
}
