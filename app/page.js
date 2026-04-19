"use client";
import { useState } from "react";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");

  const generate = async () => {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });

    const data = await res.json();
    setResult(data.result);
  };

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>Exercise Generator</h1>

      <input
        placeholder="Enter topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        style={{ padding: 10, marginRight: 10 }}
      />

      <button onClick={generate} style={{ padding: 10 }}>
        Generate
      </button>

      <pre style={{ marginTop: 20 }}>{result}</pre>
    </div>
  );
}
