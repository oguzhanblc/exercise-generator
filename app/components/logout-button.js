"use client";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: "10px 16px",
        borderRadius: 999,
        border: "none",
        background: "#174c43",
        color: "#fff",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      Log Out
    </button>
  );
}
