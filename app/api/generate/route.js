export async function POST(req) {
  const { topic, level } = await req.json();

  const prompt = `
You are a tutor.
Create 5 ${level} level exercises about ${topic}.
Return only numbered questions.
`;

  const response = await fetch(
    "https://api-inference.huggingface.co/models/bigscience/bloomz-560m",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    }
  );

  const data = await response.json();

  return Response.json({
    result: Array.isArray(data) ? data[0]?.generated_text ?? JSON.stringify(data) : JSON.stringify(data),
  });
}
