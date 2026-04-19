export async function POST(req) {
  const { topic } = await req.json();

  const response = await fetch(
    "https://api-inference.huggingface.co/models/google/flan-t5-base",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Create exercises about ${topic}`,
      }),
    }
  );

  const text = await response.text();

  // IMPORTANT: log raw response
  console.log("RAW RESPONSE:", text);

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return Response.json({
      result: "Non-JSON response received: " + text.slice(0, 200),
    });
  }

  return Response.json({
    result: data?.[0]?.generated_text || JSON.stringify(data),
  });
}
