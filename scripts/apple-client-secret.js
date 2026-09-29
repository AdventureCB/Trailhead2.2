// apple-client-secret.js — generate the "Sign in with Apple" client secret JWT
// that Supabase's Apple provider needs in its "Secret Key (for OAuth)" field.
//
// Runs locally with Node's built-in crypto (no dependencies). Your .p8 private
// key never leaves your machine.
//
// Usage:
//   node scripts/apple-client-secret.js <path-to-AuthKey_XXXX.p8> <TEAM_ID> <KEY_ID> <SERVICES_ID>
//
// Example:
//   node scripts/apple-client-secret.js ~/Downloads/AuthKey_ABC123DEF4.p8 A1B2C3D4E5 ABC123DEF4 com.lonepeakoverland.trailhub.web
//
// - path-to-.p8 : the "Sign in with Apple" key file (NOT the APNs key)
// - TEAM_ID     : Apple Developer → Membership → Team ID (10 chars)
// - KEY_ID      : the 10-char Key ID of that .p8 (also in the filename)
// - SERVICES_ID : com.lonepeakoverland.trailhub.web

const fs = require("fs");
const crypto = require("crypto");

const [, , p8Path, teamId, keyId, servicesId] = process.argv;
if (!p8Path || !teamId || !keyId || !servicesId) {
  console.error("Usage: node scripts/apple-client-secret.js <AuthKey_XXXX.p8> <TEAM_ID> <KEY_ID> <SERVICES_ID>");
  process.exit(1);
}

const privateKey = fs.readFileSync(p8Path.replace(/^~/, process.env.HOME), "utf8");
const now = Math.floor(Date.now() / 1000);
const exp = now + 180 * 24 * 3600; // Apple caps the client secret at ~6 months

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

const header = b64url(JSON.stringify({ alg: "ES256", kid: keyId }));
const payload = b64url(JSON.stringify({
  iss: teamId,
  iat: now,
  exp,
  aud: "https://appleid.apple.com",
  sub: servicesId,
}));
const signingInput = `${header}.${payload}`;
const signature = crypto.sign("sha256", Buffer.from(signingInput), { key: privateKey, dsaEncoding: "ieee-p1363" });
const jwt = `${signingInput}.${b64url(signature)}`;

console.log("\n=== Paste this into Supabase → Auth → Providers → Apple → Secret Key ===\n");
console.log(jwt);
console.log("\nExpires:", new Date(exp * 1000).toISOString(), "(regenerate before this date)\n");
