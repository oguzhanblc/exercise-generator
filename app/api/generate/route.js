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

function isValidMcq(question) {
  return (
    question &&
    question.type === "multiple-choice" &&
    typeof question.question === "string" &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.options.every((option) => typeof option === "string") &&
    typeof question.correctAnswer === "string" &&
    question.options.includes(question.correctAnswer)
  );
}

function isValidOpen(question) {
  return (
    question &&
    question.type === "open-ended" &&
    typeof question.question === "string" &&
    typeof question.sampleAnswer === "string" &&
    Array.isArray(question.acceptedPoints)
  );
}

function validateQuestions(questions, mcqCount, openEndedCount) {
  if (!Array.isArray(questions)) {
    return false;
  }

  const mcqs = questions.filter((question) => question.type === "multiple-choice");
  const openEnded = questions.filter((question) => question.type === "open-ended");

  if (mcqs.length !== mcqCount || openEnded.length !== openEndedCount) {
    return false;
  }

  return mcqs.every(isValidMcq) && openEnded.every(isValidOpen);
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

export async function POST(req) {
  try {
    const {
      topic,
      level = "beginner",
      mcqCount = 3,
      openEndedCount = 2,
    } = await req.json();

    const mcqTarget = Number(mcqCount);
    const openTarget = Number(openEndedCount);

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
      "id": "mcq-1",
      "type": "multiple-choice",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "must exactly match one option",
      "explanation": "short explanation"
    },
    {
      "id": "open-1",
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
- Only one multiple-choice option can be correct.
- "correctAnswer" must be identical to one of the option strings.
- Open-ended questions should have concise, checkable answers.
- "acceptedPoints" should contain 2 to 4 short points.
- Keep wording clear and student-friendly.
- Match the difficulty level carefully:
  - beginner: simple recall/basic understanding
  - intermediate: application and comparison
  - advanced: deeper reasoning and synthesis
`;

    let questions;

    try {
      questions = await requestQuestions(prompt);
    } catch (error) {
      questions = null;
    }

    if (!validateQuestions(questions, mcqTarget, openTarget)) {
      const retryPrompt = `${prompt}

Your previous answer was invalid.
Retry and follow the schema exactly.
Make sure the JSON is valid and complete.
`;

      questions = await requestQuestions(retryPrompt);
    }

    if (!validateQuestions(questions, mcqTarget, openTarget)) {
      return Response.json(
        { error: "The AI returned an invalid exercise format. Please try again." },
        { status: 500 }
      );
    }

    const normalizedQuestions = questions.map((question, index) => ({
      ...question,
      id:
        question.id ||
        (question.type === "open-ended" ? `open-${index + 1}` : `mcq-${index + 1}`),
      explanation: typeof question.explanation === "string" ? question.explanation : "",
      options: Array.isArray(question.options) ? question.options.slice(0, 4) : [],
      acceptedPoints: Array.isArray(question.acceptedPoints) ? question.acceptedPoints : [],
    }));

    return Response.json({ questions: normalizedQuestions });
  } catch (error) {
    return Response.json(
      { error: error.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
