export async function POST(req) {
  const { topic } = await req.json();

  const prompt = `
Create 5 learning exercises about ${topic}.
Include:
- 3 multiple choice questions
- 2 short answer questions
Keep it clear and structured.
`;

  const response = await fetch(
    "https://api-inference.huggingface.co/models/google/flan-t5-base",
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

  const data = await response.json();

  return Response.json({
    result: data[0]?.generated_text || "No response from model",
  });
}
