
"use client";
import { useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, #f6efe3 0%, #f9f7f2 35%, #eef6f3 100%)",
    fontFamily: "Arial",
    color: "#1f2937",
  },
  shell: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "24px 20px 60px",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  brand: {
    fontSize: 22,
    fontWeight: 800,
    color: "#174c43",
    letterSpacing: 0.3,
  },
  navActions: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  ghostButton: {
    padding: "10px 16px",
    borderRadius: 999,
    border: "1px solid #c8d8d2",
    background: "rgba(255,255,255,0.7)",
    color: "#174c43",
    fontWeight: 700,
    textDecoration: "none",
  },
  solidButton: {
    padding: "10px 16px",
    borderRadius: 999,
    border: "none",
    background: "#174c43",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
  },
  userText: {
    fontSize: 14,
    fontWeight: 700,
    color: "#174c43",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 24,
    alignItems: "stretch",
    marginBottom: 28,
  },
  heroCard: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid #e5e7eb",
    borderRadius: 28,
    padding: 32,
    boxShadow: "0 18px 50px rgba(25, 45, 38, 0.08)",
    backdropFilter: "blur(8px)",
  },
  eyebrow: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: 999,
    background: "#e7f4ef",
    color: "#174c43",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 52,
    lineHeight: 1.05,
    margin: "0 0 14px",
    color: "#14213d",
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 1.7,
    color: "#4b5563",
    marginBottom: 22,
    maxWidth: 620,
  },
  stats: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  statPill: {
    padding: "10px 14px",
    borderRadius: 16,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    fontWeight: 700,
    color: "#374151",
  },
  sideCard: {
    background: "linear-gradient(180deg, #174c43 0%, #1f6f5f 100%)",
    color: "#fff",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 18px 50px rgba(23, 76, 67, 0.22)",
  },
  sideList: {
    margin: "18px 0 0",
    paddingLeft: 18,
    lineHeight: 1.9,
  },
  planner: {
    background: "rgba(255,255,255,0.88)",
    border: "1px solid #e5e7eb",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 18px 50px rgba(25, 45, 38, 0.06)",
  },
  sectionTitle: {
    margin: "0 0 8px",
    fontSize: 28,
    color: "#14213d",
  },
  sectionText: {
    margin: "0 0 20px",
    color: "#6b7280",
    lineHeight: 1.7,
  },
  usageBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  usageRow: {
    margin: "6px 0",
    color: "#374151",
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 700,
    color: "#374151",
  },
  input: {
    padding: 13,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#fff",
    fontSize: 15,
  },
  countWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  countBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontSize: 20,
  },
  countValue: {
    minWidth: 44,
    textAlign: "center",
    fontWeight: 800,
    fontSize: 16,
  },
  generateButton: {
    marginTop: 22,
    padding: "14px 20px",
    borderRadius: 16,
    border: "none",
    background: "#a44a3f",
    color: "#fff",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
  },
  note: {
    marginTop: 14,
    padding: "12px 14px",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: 14,
    color: "#9a3412",
    fontWeight: 600,
  },
  error: {
    marginTop: 14,
    color: "#b42318",
    fontWeight: 700,
  },
  score: {
    marginTop: 24,
    background: "#ecfdf3",
    border: "1px solid #b7ebc6",
    borderRadius: 18,
    padding: 18,
  },
  qSection: {
    marginTop: 24,
    background: "rgba(255,255,255,0.88)",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 18px 50px rgba(25, 45, 38, 0.05)",
  },
  qCard: {
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    background: "#fff",
    border: "1px solid #e5e7eb",
  },
  badge: (type) => ({
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    background: type === "multiple-choice" ? "#e7f4ef" : "#fdf2e8",
    color: type === "multiple-choice" ? "#174c43" : "#a44a3f",
  }),
  feedback: (ok) => ({
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    background: ok ? "#ecfdf3" : "#fff1f3",
    color: ok ? "#027a48" : "#b42318",
    fontWeight: 700,
    lineHeight: 1.5,
  }),
  checkButton: {
    marginTop: 24,
    padding: "14px 20px",
    borderRadius: 16,
    border: "none",
    background: "#174c43",
    color: "#fff",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
  },
};

export default function HomeClient({ userEmail, logoutButton }) {
  const [planName, setPlanName] = useState("free");
  const [generationUsage, setGenerationUsage] = useState({ used: 0, limit: 20 });
  const [checkUsage, setCheckUsage] = useState({ used: 0, limit: 40 });
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("beginner");
  const [mcqCount, setMcqCount] = useState(5);
  const [openEndedCount, setOpenEndedCount] = useState(2);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const changeCount = (setter, current, delta, max) => {
    const next = Math.max(1, Math.min(max, Number(current) + delta));
    setter(next);
  };

  const updateAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const applyUsage = (usage) => {
    if (!usage) return;
    setPlanName(usage.plan || "free");
    setGenerationUsage({
      used: usage.generationsUsed ?? 0,
      limit: usage.generationsLimit ?? 20,
    });
    setCheckUsage({
      used: usage.checksUsed ?? 0,
      limit: usage.checksLimit ?? 40,
    });
    if (usage.maxMcq) {
      setMcqCount((current) => Math.min(current, usage.maxMcq));
    }
    if (usage.maxOpenEnded) {
      setOpenEndedCount((current) => Math.min(current, usage.maxOpenEnded));
    }
  };

  const generate = async () => {
    try {
      if (!topic.trim()) {
        setMessage("Please enter a topic first.");
        return;
      }

      setLoading(true);
      setMessage("");
      setQuestions([]);
      setAnswers({});
      setResults([]);

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setMessage("Please log in to generate exercises.");
        return;
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          topic,
          level,
          mcqCount: Number(mcqCount),
          openEndedCount: Number(openEndedCount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        applyUsage(data.usage);
        setMessage(data.error || "Something went wrong.");
        return;
      }

      setQuestions(data.questions || []);
      applyUsage(data.usage);
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

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setMessage("Please log in to check answers.");
        return;
      }

      const res = await fetch("/api/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ questions, answers }),
      });

      const data = await res.json();

      if (!res.ok) {
        applyUsage(data.usage);
        setMessage(data.error || "Could not check answers.");
        return;
      }

      setResults(data.results || []);
      applyUsage(data.usage);
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
    if (!results.length) return null;
    const correct = results.filter((item) => item.isCorrect).length;
    const total = results.length;
    const percent = Math.round((correct / total) * 100);
    return { correct, total, percent };
  }, [results]);

  const renderQuestion = (question, index) => {
    const checkResult = resultFor(question.id);

    return (
      <div key={question.id} style={styles.qCard}>
        <div style={{ marginBottom: 10 }}>
          <span style={styles.badge(question.type)}>
            {question.type === "multiple-choice" ? "Multiple Choice" : "Open-Ended"}
          </span>
        </div>

        <h3 style={{ marginTop: 0 }}>
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
            style={{ ...styles.input, width: "100%", resize: "vertical" }}
            placeholder="Write your answer here"
          />
        )}

        {checkResult ? (
          <div style={styles.feedback(checkResult.isCorrect)}>{checkResult.feedback}</div>
        ) : null}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.nav}>
          <div style={styles.brand}>LearnForge</div>
          <div style={styles.navActions}>
            {userEmail ? (
              <>
                <span style={styles.userText}>{userEmail}</span>
                {logoutButton}
              </>
            ) : (
              <>
                <a href="/login" style={styles.ghostButton}>Log In</a>
                <a href="/signup" style={styles.solidButton}>Sign Up</a>
              </>
            )}
          </div>
        </div>

        <div style={styles.hero}>
          <div style={styles.heroCard}>
            <div style={styles.eyebrow}>LEARNFORGE</div>
            <h1 style={styles.title}>Learn smarter with AI-built practice in seconds.</h1>
            <p style={styles.subtitle}>
              Build topic-based worksheets with multiple-choice and open-ended questions,
              then let learners check their answers instantly.
            </p>

            <div style={styles.stats}>
              <div style={styles.statPill}>3 difficulty levels</div>
              <div style={styles.statPill}>Instant answer checking</div>
              <div style={styles.statPill}>Free plan included</div>
            </div>
          </div>

          <div style={styles.sideCard}>
            <h2 style={{ marginTop: 0 }}>Current Plan</h2>
            <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
              You are currently on the <strong>{planName}</strong> plan.
            </p>
            <div style={styles.usageBox}>
              <div style={styles.usageRow}>
                Generations used: {generationUsage.used} / {generationUsage.limit}
              </div>
              <div style={styles.usageRow}>
                Answer checks used: {checkUsage.used} / {checkUsage.limit}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.planner}>
          <h2 style={styles.sectionTitle}>Create Your Exercise Set</h2>
          <p style={styles.sectionText}>
            Your account limits are enforced automatically based on your membership.
          </p>

          <div style={styles.grid}>
            <div style={{ ...styles.field, gridColumn: "span 2" }}>
              <label style={styles.label}>Topic</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Examples: fractions, climate change, past simple"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Difficulty</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                style={styles.input}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Multiple Choice Questions</label>
              <div style={styles.countWrap}>
                <button
                  type="button"
                  style={styles.countBtn}
                  onClick={() => changeCount(setMcqCount, mcqCount, -1, 20)}
                >
                  -
                </button>
                <div style={styles.countValue}>{mcqCount}</div>
                <button
                  type="button"
                  style={styles.countBtn}
                  onClick={() => changeCount(setMcqCount, mcqCount, 1, 20)}
                >
                  +
                </button>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Open-Ended Questions</label>
              <div style={styles.countWrap}>
                <button
                  type="button"
                  style={styles.countBtn}
                  onClick={() => changeCount(setOpenEndedCount, openEndedCount, -1, 10)}
                >
                  -
                </button>
                <div style={styles.countValue}>{openEndedCount}</div>
                <button
                  type="button"
                  style={styles.countBtn}
                  onClick={() => changeCount(setOpenEndedCount, openEndedCount, 1, 10)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button onClick={generate} style={styles.generateButton} disabled={loading}>
            {loading ? "Generating..." : "Generate Worksheet"}
          </button>

          <div style={styles.note}>
            Free plan defaults: 5 MCQ, 2 open-ended, 20 generations/month, 40 answer checks/month.
          </div>

          {message ? <div style={styles.error}>{message}</div> : null}
        </div>

        {score ? (
          <div style={styles.score}>
            <h3 style={{ margin: "0 0 6px" }}>Score Summary</h3>
            <div style={{ fontWeight: 800, fontSize: 18 }}>
              {score.correct} / {score.total} correct ({score.percent}%)
            </div>
          </div>
        ) : null}

        {multipleChoiceQuestions.length > 0 ? (
          <div style={styles.qSection}>
            <h2 style={{ marginTop: 0 }}>Multiple Choice</h2>
            <p style={{ color: "#6b7280" }}>Choose one answer for each question.</p>
            {multipleChoiceQuestions.map((question, index) => renderQuestion(question, index))}
          </div>
        ) : null}

        {openEndedQuestions.length > 0 ? (
          <div style={styles.qSection}>
            <h2 style={{ marginTop: 0 }}>Open-Ended</h2>
            <p style={{ color: "#6b7280" }}>Write your answer in your own words.</p>
            {openEndedQuestions.map((question, index) => renderQuestion(question, index))}
          </div>
        ) : null}

        {questions.length > 0 ? (
          <button onClick={checkAnswers} style={styles.checkButton} disabled={checking}>
            {checking ? "Checking Answers..." : "Check Answers"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
