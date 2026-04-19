export async function POST(req) {
  const { topic, level } = await req.json();

  const prompt = `
Generate 5 ${level} level exercises about ${topic}.
Include questions only, no explanation.
`;

  const response = await fetch(
    "https://api-inference.huggingface.co/models/google/flan-t5-small",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
      }),
    }
  );

  const text = await response.text();

  try {
    const data = JSON.parse(text);

    return Response.json({
      result: data?.[0]?.generated_text || JSON.stringify(data),
    });
  } catch {
    return Response.json({
      result: "RAW: " + text,
    });
  }
}
