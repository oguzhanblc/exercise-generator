"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Log In to LearnForge</h1>
      <form onSubmit={handleLogin} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 12 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 12 }}
        />
        <button type="submit" style={{ padding: 12 }}>Log In</button>
      </form>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
