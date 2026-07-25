import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

// At-rest encryption for user secrets (e.g. the Granola API key).
// AES-256-GCM with a key derived from AUTH_SECRET — already present in every
// environment, so there is no new secret to provision. Stored format:
//   enc.v1.<base64(iv[12] | tag[16] | ciphertext)>
// Values without the prefix are treated as legacy plaintext and returned as-is
// on decrypt, then re-encrypted on the next write.

const PREFIX = "enc.v1.";

function key(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required to encrypt secrets at rest");
  return createHash("sha256").update(secret).digest(); // 32 bytes
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decryptSecret(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored; // legacy plaintext
  const raw = Buffer.from(stored.slice(PREFIX.length), "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ct = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
