export async function POST(req) {
  const { topic } = await req.json();

  return Response.json({
    result: `Exercises for ${topic}`
  });
}
