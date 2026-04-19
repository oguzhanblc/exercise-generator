export async function POST(req) {
  const { topic } = await req.json();

  const response = await fetch(
    "https://api-inference.huggingface.co/models/bigscience/bloom-560m",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Write 5 short learning exercises about ${topic}`,
      }),
    }
  );

  const text = await response.text();

  // Always return raw for debugging safety
  return Response.json({
    result: text,
  });
}
