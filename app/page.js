"use client";
import { useState } from "react";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");

  const generate = async () => {
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          level: "beginner",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult(data.error || "Something went wrong.");
        return;
      }

      setResult(data.result || "No result returned.");
    } catch (error) {
      setResult("Request failed. Please try again.");
    }
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
}
