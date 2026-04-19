export async function POST(req) {
  try {
    const { topic, level = "beginner" } = await req.json();

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
        body: JSON.stringify({
          inputs: prompt,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: data.error || "Hugging Face request failed",
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        result: Array.isArray(data)
          ? data[0]?.generated_text || "No result returned."
          : data.generated_text || JSON.stringify(data),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || "Unexpected server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
      { error: error.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
