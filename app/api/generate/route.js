export async function POST(req) {
  const { topic } = await req.json();

  const response = await fetch(
    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Create 5 simple learning exercises about ${topic}. Keep it structured.`,
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
