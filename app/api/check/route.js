import { createAdminClient } from "../../../lib/supabase/admin";
import { PLAN_LIMITS } from "../../../lib/plan-limits";

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

function getMonthKey() {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}`;
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

  return {
    plan: data?.plan || "free",
    status: data?.status || "active",
  };
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

async function incrementChecks(supabase, usageRow) {
  const { error } = await supabase
    .from("usage_counters")
    .update({
      checks_used: usageRow.checks_used + 1,
    })
    .eq("id", usageRow.id);

  if (error) {
    throw new Error("Could not update check usage.");
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

    if (usage.checks_used >= limits.maxChecksPerMonth) {
      return Response.json(
        {
          error: "You reached your monthly answer-check limit.",
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

    const { questions = [], answers = {} } = await req.json();

    const results = [];
    const openEndedToCheck = [];

    for (const question of questions) {
      const userAnswer = answers[question.id] || "";

      if (question.type === "multiple-choice") {
        const isCorrect = normalize(userAnswer) === normalize(question.correctAnswer);

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

      const checkedResults = await requestOpenEndedCheck(prompt);
      results.push(...(checkedResults || []));
    }

    await incrementChecks(supabase, usage);

    return Response.json({
      results,
      usage: {
        plan: membership.plan,
        monthKey,
        generationsUsed: usage.generations_used,
        generationsLimit: limits.maxGenerationsPerMonth,
        checksUsed: usage.checks_used + 1,
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
