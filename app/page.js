import { createClient } from "../lib/supabase/server";
import HomeClient from "./components/home-client";
import LogoutButton from "./components/logout-button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <HomeClient
      userEmail={user?.email || ""}
      logoutButton={user ? <LogoutButton /> : null}
    />
  );
}
