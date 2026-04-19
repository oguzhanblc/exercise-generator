export async function POST(req) {
  const { topic } = await req.json();

  const response = await fetch(
    "https://api-inference.huggingface.co/models/google/flan-t5-small",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Generate 5 short exercises about ${topic}`,
      }),
    }
  );

  const text = await response.text();

  // If Hugging Face returns HTML or error, show it
  if (!text.startsWith("[")) {
    return Response.json({
      result: "HF ERROR: " + text.slice(0, 200),
    });
  }

  try {
    const data = JSON.parse(text);
    return Response.json({
      result: data?.[0]?.generated_text || JSON.stringify(data),
    });
  } catch {
    return Response.json({
      result: "Parse error: " + text,
    });
  }
}
