function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

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

function isValidCheckResults(results, expectedIds) {
  if (!Array.isArray(results)) {
    return false;
  }

  const ids = new Set(expectedIds);

  return results.every(
    (item) =>
      item &&
      typeof item.id === "string" &&
      ids.has(item.id) &&
      typeof item.isCorrect === "boolean" &&
      typeof item.feedback === "string"
  );
}

async function requestOpenEndedCheck(prompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenRouter answer check failed");
  }

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No content returned.");
  }

  const parsed = parseJsonFromText(content);
  return parsed.results;
}

export async function POST(req) {
  try {
    const { questions = [], answers = {} } = await req.json();

    const results = [];
    const openEndedToCheck = [];

    for (const question of questions) {
      const userAnswer = answers[question.id] || "";

      if (question.type === "multiple-choice") {
        const isCorrect =
          normalize(userAnswer) === normalize(question.correctAnswer);

        results.push({
          id: question.id,
          isCorrect,
          feedback: isCorrect
            ? `Correct. ${question.explanation || ""}`.trim()
            : `Incorrect. Correct answer: ${question.correctAnswer}. ${question.explanation || ""}`.trim(),
        });
      } else {
        openEndedToCheck.push({
          id: question.id,
          question: question.question,
          sampleAnswer: question.sampleAnswer,
          acceptedPoints: question.acceptedPoints || [],
          explanation: question.explanation || "",
          userAnswer,
        });
      }
    }

    if (openEndedToCheck.length > 0) {
      const expectedIds = openEndedToCheck.map((item) => item.id);

      const prompt = `
You are grading student answers.

Return ONLY valid JSON in this exact format:
{
  "results": [
    {
      "id": "open-1",
      "isCorrect": true,
      "feedback": "short feedback"
    }
  ]
}

Grading rules:
- Be fair about wording differences.
- Mark isCorrect true if the student answer captures the main idea well enough.
- Mark isCorrect false if it misses the core meaning.
- Use sampleAnswer and acceptedPoints as the grading standard.
- Feedback must be short, specific, and helpful.
- If incorrect, mention what is missing.
- Do not include markdown.
- Do not include any text outside the JSON.

Answers to grade:
${JSON.stringify(openEndedToCheck, null, 2)}
`;

      let checkedResults;

      try {
        checkedResults = await requestOpenEndedCheck(prompt);
      } catch (error) {
        checkedResults = null;
      }

      if (!isValidCheckResults(checkedResults, expectedIds)) {
        const retryPrompt = `${prompt}

Your previous answer was invalid.
Retry and return only valid JSON in the required format.
`;

        checkedResults = await requestOpenEndedCheck(retryPrompt);
      }

      if (!isValidCheckResults(checkedResults, expectedIds)) {
        return Response.json(
          { error: "The AI returned an invalid answer-check format. Please try again." },
          { status: 500 }
        );
      }

      results.push(...checkedResults);
    }

    return Response.json({ results });
  } catch (error) {
    return Response.json(
      { error: error.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
