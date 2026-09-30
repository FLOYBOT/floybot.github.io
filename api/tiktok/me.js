import { supabase } from "../../lib/supabase.js";
import { decrypt } from "../../lib/crypto.js";

function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  const match = raw.split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export default async function handler(req, res) {
  const session = readCookie(req, "tiktok_session");
  if (!session) return res.status(401).json({ connected: false });

  let openId;
  try {
    openId = decrypt(session);
  } catch {
    return res.status(401).json({ connected: false });
  }

  const { data, error } = await supabase
    .from("tiktok_accounts")
    .select("open_id,display_name,avatar_url,scopes,access_expires_at")
    .eq("open_id", openId)
    .maybeSingle();

  if (error) return res.status(500).json({ error: "database_error" });
  if (!data) return res.status(404).json({ connected: false });

  res.status(200).json({ connected: true, account: data });
}
