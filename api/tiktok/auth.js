import crypto from "node:crypto";

export default function handler(req, res) {
  const state = crypto.randomBytes(32).toString("base64url");
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  const clientKey = process.env.TIKTOK_CLIENT_KEY;

  if (!redirectUri || !clientKey) {
    return res.status(500).json({ error: "TikTok backend is not configured" });
  }

  res.setHeader(
    "Set-Cookie",
    `tiktok_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );

  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: "code",
    scope: "user.info.basic",
    redirect_uri: redirectUri,
    state
  });

  res.redirect(`https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`);
}
