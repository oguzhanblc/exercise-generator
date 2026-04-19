import { createAdminClient } from "../../../lib/supabase/admin";
import { PLAN_LIMITS } from "../../../lib/plan-limits";

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

function getMonthKey() {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}`;
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

  return { user, supabase };
}

async function getMembership(supabase, userId) {
  const { data, error } = await supabase
    .from("memberships")
    .select("plan, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Could not load membership.");
  }

  const plan = data?.plan || "free";
  const status = data?.status || "active";

  return { plan, status };
}

async function getOrCreateUsageCounter(supabase, userId, monthKey) {
  const { data: existing, error: fetchError } = await supabase
    .from("usage_counters")
    .select("id, generations_used, checks_used, month_key")
    .eq("user_id", userId)
    .eq("month_key", monthKey)
    .maybeSingle();

  if (fetchError) {
    throw new Error("Could not load usage.");
  }

  if (existing) {
    return existing;
  }

  const { data: created, error: createError } = await supabase
    .from("usage_counters")
    .insert({
      user_id: userId,
      month_key: monthKey,
      generations_used: 0,
      checks_used: 0,
    })
    .select("id, generations_used, checks_used, month_key")
    .single();

  if (createError) {
    throw new Error("Could not create usage counter.");
  }

  return created;
}

async function incrementGenerations(supabase, usageRow) {
  const { error } = await supabase
    .from("usage_counters")
    .update({
      generations_used: usageRow.generations_used + 1,
    })
    .eq("id", usageRow.id);

  if (error) {
    throw new Error("Could not update generation usage.");
  }
}

export async function POST(req) {
  try {
    const authResult = await requireUser(req);

    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user, supabase } = authResult;
    const membership = await getMembership(supabase, user.id);

    if (membership.status !== "active") {
      return Response.json(
        { error: "Your membership is not active." },
        { status: 403 }
      );
    }

    const limits = PLAN_LIMITS[membership.plan] || PLAN_LIMITS.free;
    const monthKey = getMonthKey();
    const usage = await getOrCreateUsageCounter(supabase, user.id, monthKey);

    if (usage.generations_used >= limits.maxGenerationsPerMonth) {
      return Response.json(
        {
          error: "You reached your monthly generation limit.",
          usage: {
            plan: membership.plan,
            monthKey,
            generationsUsed: usage.generations_used,
            generationsLimit: limits.maxGenerationsPerMonth,
            checksUsed: usage.checks_used,
            checksLimit: limits.maxChecksPerMonth,
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const topic = body.topic;
    const level = body.level || "beginner";
    const requestedMcq = Number(body.mcqCount ?? limits.maxMcq);
    const requestedOpen = Number(body.openEndedCount ?? limits.maxOpenEnded);

    const mcqTarget = Math.min(requestedMcq, limits.maxMcq);
    const openTarget = Math.min(requestedOpen, limits.maxOpenEnded);

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

    await incrementGenerations(supabase, usage);

    return Response.json({
      questions,
      usage: {
        plan: membership.plan,
        monthKey,
        generationsUsed: usage.generations_used + 1,
        generationsLimit: limits.maxGenerationsPerMonth,
        checksUsed: usage.checks_used,
        checksLimit: limits.maxChecksPerMonth,
        maxMcq: limits.maxMcq,
        maxOpenEnded: limits.maxOpenEnded,
      },
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
