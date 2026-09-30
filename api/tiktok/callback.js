import { supabase } from "../../lib/supabase.js";
import { encrypt } from "../../lib/crypto.js";
import crypto from "node:crypto";

function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  const match = raw.split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export default async function handler(req, res) {
  const { code, state, error, error_description } = req.query;
  const expectedState = readCookie(req, "tiktok_oauth_state");
  const frontend = process.env.FRONTEND_URL;

  if (!frontend) return res.status(500).send("FRONTEND_URL is not configured");
  if (error) return res.redirect(`${frontend}/?tiktok_error=${encodeURIComponent(error_description || error)}#bot`);
  if (!code || !state || !expectedState || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expectedState))) {
    return res.status(400).send("Invalid OAuth state");
  }

  try {
    const body = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code: String(code),
      grant_type: "authorization_code",
      redirect_uri: process.env.TIKTOK_REDIRECT_URI
    });

    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok || !tokens.access_token || !tokens.open_id) {
      console.error("TikTok token error", tokens);
      return res.redirect(`${frontend}/?tiktok_error=token_exchange_failed#bot`);
    }

    const infoUrl = new URL("https://open.tiktokapis.com/v2/user/info/");
    infoUrl.searchParams.set("fields", "open_id,display_name,avatar_url");
    const infoResponse = await fetch(infoUrl, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const info = await infoResponse.json();
    const user = info?.data?.user || {};

    const row = {
      open_id: tokens.open_id,
      display_name: user.display_name || null,
      avatar_url: user.avatar_url || null,
      access_token_enc: encrypt(tokens.access_token),
      refresh_token_enc: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      access_expires_at: new Date(Date.now() + Number(tokens.expires_in || 86400) * 1000).toISOString(),
      refresh_expires_at: new Date(Date.now() + Number(tokens.refresh_expires_in || 31536000) * 1000).toISOString(),
      scopes: tokens.scope || ""
    };

    const { error: dbError } = await supabase.from("tiktok_accounts").upsert(row, { onConflict: "open_id" });
    if (dbError) {
      console.error("DB error", dbError);
      return res.redirect(`${frontend}/?tiktok_error=storage_failed#bot`);
    }

    res.setHeader("Set-Cookie", "tiktok_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
    res.redirect(`${frontend}/?tiktok=connected#bot`);
  } catch (e) {
    console.error(e);
    res.redirect(`${frontend}/?tiktok_error=server_error#bot`);
  }
}
