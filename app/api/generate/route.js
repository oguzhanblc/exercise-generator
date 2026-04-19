import { createAdminClient } from "../../../lib/supabase/admin";

function parseJsonFromText(text) {
  const trimmed = text.trim();

  if (trimmed.startsWith("```")) {
    const cleaned = trimmed
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "");
    return JSON.parse(cleaned);
  }

  return JSON.parse(trimmed);
}

function toSafeString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeQuestions(rawQuestions, mcqCount, openEndedCount) {
  if (!Array.isArray(rawQuestions)) {
    return [];
  }

  const mcqs = rawQuestions
    .filter((question) => question?.type === "multiple-choice")
    .map((question, index) => {
      const options = Array.isArray(question.options)
        ? question.options.filter((option) => typeof option === "string").slice(0, 4)
        : [];

      let correctAnswer = toSafeString(question.correctAnswer);

      if (!options.includes(correctAnswer) && options.length > 0) {
        correctAnswer = options[0];
      }

      return {
        id: `mcq-${index + 1}`,
        type: "multiple-choice",
        question: toSafeString(question.question, `Question ${index + 1}`),
        options:
          options.length === 4
            ? options
            : ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer,
        explanation: toSafeString(question.explanation),
      };
    })
    .slice(0, mcqCount);

  const openEnded = rawQuestions
    .filter((question) => question?.type === "open-ended")
    .map((question, index) => ({
      id: `open-${index + 1}`,
      type: "open-ended",
      question: toSafeString(question.question, `Question ${index + 1}`),
      sampleAnswer: toSafeString(question.sampleAnswer, "No sample answer provided."),
      acceptedPoints: Array.isArray(question.acceptedPoints)
        ? question.acceptedPoints.filter((point) => typeof point === "string").slice(0, 4)
        : [],
      explanation: toSafeString(question.explanation),
    }))
    .slice(0, openEndedCount);

  return [...mcqs, ...openEnded];
}

async function requestQuestions(prompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenRouter request failed");
  }

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No content returned.");
  }

  const parsed = parseJsonFromText(content);
  return parsed.questions;
}

async function requireUser(req) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "You must be logged in.", status: 401 };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createAdminClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: "Invalid session. Please log in again.", status: 401 };
  }

  return { user };
}

export async function POST(req) {
  try {
    const authResult = await requireUser(req);

    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status });
    }

    const FREE_MCQ_LIMIT = 5;
    const FREE_OPEN_LIMIT = 2;

    const {
      topic,
      level = "beginner",
      mcqCount = FREE_MCQ_LIMIT,
      openEndedCount = FREE_OPEN_LIMIT,
    } = await req.json();

    const mcqTarget = Math.min(Number(mcqCount), FREE_MCQ_LIMIT);
    const openTarget = Math.min(Number(openEndedCount), FREE_OPEN_LIMIT);

    const prompt = `
You are creating a practice worksheet.

Topic: ${topic}
Difficulty: ${level}

Return ONLY valid JSON.
Do not include markdown.
Do not include any text before or after the JSON.

Use this exact schema:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "must exactly match one option",
      "explanation": "short explanation"
    },
    {
      "type": "open-ended",
      "question": "string",
      "sampleAnswer": "short model answer",
      "acceptedPoints": ["key point 1", "key point 2"],
      "explanation": "short explanation"
    }
  ]
}

Rules:
- Create exactly ${mcqTarget} multiple-choice questions.
- Create exactly ${openTarget} open-ended questions.
- Multiple-choice questions must each have exactly 4 options.
- Only one option can be correct.
- Open-ended questions should be short and checkable.
`;

    let rawQuestions;

    try {
      rawQuestions = await requestQuestions(prompt);
    } catch {
      rawQuestions = null;
    }

    if (!Array.isArray(rawQuestions)) {
      const retryPrompt = `${prompt}

Your previous response was invalid.
Return only valid JSON with the required schema.
`;
      rawQuestions = await requestQuestions(retryPrompt);
    }

    const questions = normalizeQuestions(rawQuestions, mcqTarget, openTarget);

    if (questions.length === 0) {
      return Response.json(
        { error: "The AI could not generate usable questions. Please try another topic." },
        { status: 500 }
      );
    }

    return Response.json({ questions });
  } catch (error) {
    return Response.json(
      { error: error.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
