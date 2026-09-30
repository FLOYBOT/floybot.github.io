import crypto from "node:crypto";

const key = () => {
  const raw = process.env.TOKEN_ENCRYPTION_KEY || "";
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes encoded as 64 hex characters");
  }
  return Buffer.from(raw, "hex");
};

export function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map(b => b.toString("base64url")).join(".");
}

export function decrypt(value) {
  const [iv, tag, encrypted] = String(value).split(".").map(x => Buffer.from(x, "base64url"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
