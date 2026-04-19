export async function POST(req) {
  const { topic } = await req.json();

  const exercises = `
Exercises for ${topic}:

1. What is ${topic}? Explain in your own words.
2. Give 3 real-world examples of ${topic}.
3. Why is ${topic} important?
4. Create one simple question about ${topic}.
5. Summarize ${topic} in one sentence.
`;

  return Response.json({
    result: exercises,
  });
}
