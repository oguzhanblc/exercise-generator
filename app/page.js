"use client";
import { useMemo, useState } from "react";

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f7f2e8 0%, #fffdf8 100%)",
  padding: "40px 20px",
  fontFamily: "Arial",
  color: "#1f2937",
};

const shellStyle = {
  maxWidth: 980,
  margin: "0 auto",
};

const heroStyle = {
  background: "#fffaf0",
  border: "1px solid #eadfca",
  borderRadius: 20,
  padding: 28,
  boxShadow: "0 12px 30px rgba(90, 62, 20, 0.08)",
  marginBottom: 24,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
  marginTop: 18,
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const labelStyle = {
  fontSize: 14,
  fontWeight: 700,
  color: "#5b4636",
};

const inputStyle = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid #d6c6ad",
  background: "#fff",
  fontSize: 15,
};

const primaryButtonStyle = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "#1f6f5f",
  color: "white",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "#a44a3f",
  color: "white",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};

const countWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const countButtonStyle = {
  width: 36,
  height: 36,
  borderRadius: 10,
  border: "1px solid #d6c6ad",
  background: "#fff",
  fontSize: 20,
  cursor: "pointer",
};

const countValueStyle = {
  minWidth: 40,
  textAlign: "center",
  fontWeight: 700,
  fontSize: 16,
};

const sectionStyle = {
  background: "#fffaf0",
  border: "1px solid #eadfca",
  borderRadius: 18,
  padding: 22,
  boxShadow: "0 10px 24px rgba(42, 28, 10, 0.05)",
  marginTop: 22,
};

const questionCardStyle = {
  marginTop: 16,
  padding: 18,
  border: "1px solid #e7dcc8",
  borderRadius: 16,
  background: "#fff",
};

const badgeStyle = (type) => ({
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  background: type === "multiple-choice" ? "#e7f6f2" : "#fdf0e6",
  color: type === "multiple-choice" ? "#1f6f5f" : "#a44a3f",
  fontSize: 12,
  fontWeight: 700,
});

export default function Home() {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("beginner");
  const [mcqCount, setMcqCount] = useState(3);
  const [openEndedCount, setOpenEndedCount] = useState(2);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const updateAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const changeCount = (setter, value) => {
    setter((current) => Math.max(1, Number(current) + value));
  };

  const generate = async () => {
    try {
      setLoading(true);
      setMessage("");
      setQuestions([]);
      setAnswers({});
      setResults([]);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          level,
          mcqCount: Number(mcqCount),
          openEndedCount: Number(openEndedCount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.");
        return;
      }

      setQuestions(data.questions || []);
    } catch (error) {
      setMessage("Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkAnswers = async () => {
    try {
      setChecking(true);
      setMessage("");

      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions,
          answers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Could not check answers.");
        return;
      }

      setResults(data.results || []);
    } catch (error) {
      setMessage("Answer check failed.");
    } finally {
      setChecking(false);
    }
  };

  const resultFor = (id) => results.find((item) => item.id === id);

  const multipleChoiceQuestions = useMemo(
    () => questions.filter((question) => question.type === "multiple-choice"),
    [questions]
  );

  const openEndedQuestions = useMemo(
    () => questions.filter((question) => question.type === "open-ended"),
    [questions]
  );

  const score = useMemo(() => {
    if (results.length === 0) {
      return null;
    }

    const correct = results.filter((item) => item.isCorrect).length;
    const total = results.length;
    const percent = Math.round((correct / total) * 100);

    return { correct, total, percent };
  }, [results]);

  const renderQuestion = (question, index) => {
    const checkResult = resultFor(question.id);

    return (
      <div key={question.id} style={questionCardStyle}>
        <div style={{ marginBottom: 10 }}>
          <span style={badgeStyle(question.type)}>
            {question.type === "multiple-choice" ? "Multiple Choice" : "Open-Ended"}
          </span>
        </div>

        <h3 style={{ marginTop: 0, marginBottom: 14 }}>
          {index + 1}. {question.question}
        </h3>

        {question.type === "multiple-choice" ? (
          <div>
            {question.options.map((option) => (
              <label key={option} style={{ display: "block", marginBottom: 10 }}>
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                />{" "}
                {option}
              </label>
            ))}
          </div>
        ) : (
          <textarea
            value={answers[question.id] || ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            rows={5}
            style={{ ...inputStyle, width: "100%", resize: "vertical" }}
            placeholder="Type your answer here"
          />
        )}

        {checkResult ? (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              background: checkResult.isCorrect ? "#ecfdf3" : "#fff1f3",
              color: checkResult.isCorrect ? "#027a48" : "#b42318",
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            {checkResult.feedback}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        <div style={heroStyle}>
          <p style={{ margin: 0, color: "#a44a3f", fontWeight: 700, letterSpacing: 1 }}>
            PRACTICE BUILDER
          </p>

          <h1 style={{ marginTop: 10, marginBottom: 10, fontSize: 38 }}>
            Exercise Generator
          </h1>

          <p style={{ marginTop: 0, marginBottom: 0, color: "#5b4636", lineHeight: 1.6 }}>
            Choose a topic, set the difficulty, decide how many question types you want,
            then generate a custom exercise set and check the answers.
          </p>

          <div style={gridStyle}>
            <div style={{ ...fieldStyle, gridColumn: "span 2" }}>
              <label style={labelStyle}>Topic</label>
              <input
                placeholder="Examples: fractions, photosynthesis, past tense"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Difficulty</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                style={inputStyle}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Multiple Choice Questions</label>
              <div style={countWrapStyle}>
                <button
                  type="button"
                  style={countButtonStyle}
                  onClick={() => changeCount(setMcqCount, -1)}
                >
                  -
                </button>
                <div style={countValueStyle}>{mcqCount}</div>
                <button
                  type="button"
                  style={countButtonStyle}
                  onClick={() => changeCount(setMcqCount, 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Open-Ended Questions</label>
              <div style={countWrapStyle}>
                <button
                  type="button"
                  style={countButtonStyle}
                  onClick={() => changeCount(setOpenEndedCount, -1)}
                >
                  -
                </button>
                <div style={countValueStyle}>{openEndedCount}</div>
                <button
                  type="button"
                  style={countButtonStyle}
                  onClick={() => changeCount(setOpenEndedCount, 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button onClick={generate} style={primaryButtonStyle} disabled={loading}>
              {loading ? "Generating..." : "Generate Exercises"}
            </button>
          </div>

          {message ? (
            <p style={{ marginTop: 16, color: "#b42318", fontWeight: 600 }}>{message}</p>
          ) : null}
        </div>

        {score ? (
          <div
            style={{
              ...sectionStyle,
              background: "#f6fbf9",
              border: "1px solid #d2eadf",
              marginTop: 0,
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>Score Summary</h2>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1f6f5f" }}>
              {score.correct} / {score.total} correct ({score.percent}%)
            </p>
          </div>
        ) : null}

        {multipleChoiceQuestions.length > 0 ? (
          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 4 }}>Multiple Choice</h2>
            <p style={{ marginTop: 0, color: "#6b7280" }}>
              Choose one answer for each question.
            </p>
            {multipleChoiceQuestions.map((question, index) => renderQuestion(question, index))}
          </div>
        ) : null}

        {openEndedQuestions.length > 0 ? (
          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 4 }}>Open-Ended</h2>
            <p style={{ marginTop: 0, color: "#6b7280" }}>
              Write your answer in your own words.
            </p>
            {openEndedQuestions.map((question, index) => renderQuestion(question, index))}
          </div>
        ) : null}

        {questions.length > 0 ? (
          <div style={{ marginTop: 24 }}>
            <button onClick={checkAnswers} style={secondaryButtonStyle} disabled={checking}>
              {checking ? "Checking Answers..." : "Check Answers"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
