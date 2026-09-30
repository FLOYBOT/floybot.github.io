import { supabase } from "../../lib/supabase.js";

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from("tiktok_accounts")
    .select("open_id,display_name,avatar_url,scopes,access_expires_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: "database_error" });
  if (!data) return res.status(404).json({ connected: false });

  res.status(200).json({ connected: true, account: data });
}
