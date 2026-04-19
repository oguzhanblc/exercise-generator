"use client";
import { useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Account created. Check your email to verify your account.");
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Sign Up</h1>
      <form onSubmit={handleSignup} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
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
        <button type="submit" style={{ padding: 12 }}>Create Account</button>
      </form>
      {message ? <p>{message}</p> : null}
    </div>
  );
}

