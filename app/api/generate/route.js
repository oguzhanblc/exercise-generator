export async function POST(req) {
  try {
    const { topic, level = "beginner" } = await req.json();

    const prompt = `You are a tutor. Create 5 ${level} level exercises about ${topic}. Return only numbered questions.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data?.error?.message || "OpenRouter request failed" },
        { status: response.status }
      );
    }

    return Response.json({
      result: data?.choices?.[0]?.message?.content || "No result returned.",
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
