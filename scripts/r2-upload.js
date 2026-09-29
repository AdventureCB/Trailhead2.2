// r2-upload.js — multipart upload a file to Cloudflare R2 (S3-compatible).
// Credentials come from env vars (never hardcoded/committed):
//   R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY
// Usage: node scripts/r2-upload.js <localFile> <objectKey> [bucket]
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const fs = require("fs");

const [, , filePath, key, bucket = "trailhub-tiles"] = process.argv;
if (!filePath || !key) { console.error("Usage: node scripts/r2-upload.js <file> <key> [bucket]"); process.exit(1); }
if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY || !process.env.R2_SECRET_KEY) {
  console.error("Set R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY env vars."); process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY, secretAccessKey: process.env.R2_SECRET_KEY },
});

const SINGLE_PUT_MAX = 4.8 * 1024 * 1024 * 1024; // R2 single-PUT limit is 5GB

(async () => {
  const total = fs.statSync(filePath).size;
  if (total <= SINGLE_PUT_MAX) {
    // Single PUT — avoids multipart-assembly corruption seen on R2.
    process.stdout.write(`single PUT ${(total / 1e6).toFixed(0)}MB...`);
    await client.send(new PutObjectCommand({
      Bucket: bucket, Key: key,
      Body: fs.createReadStream(filePath),
      ContentLength: total,
      ContentType: "application/octet-stream",
    }));
    console.log(`\n✅ uploaded ${key} to ${bucket} (single PUT)`);
    return;
  }
  const up = new Upload({
    client,
    params: { Bucket: bucket, Key: key, Body: fs.createReadStream(filePath), ContentType: "application/octet-stream" },
    queueSize: 4,
    partSize: 64 * 1024 * 1024,
  });
  up.on("httpUploadProgress", (p) => {
    const pct = p.loaded && total ? ((p.loaded / total) * 100).toFixed(1) : "?";
    process.stdout.write(`\r${(p.loaded / 1e6).toFixed(0)}MB / ${(total / 1e6).toFixed(0)}MB (${pct}%)   `);
  });
  await up.done();
  console.log(`\n✅ uploaded ${key} to ${bucket} (multipart)`);
})().catch((e) => { console.error("\nupload failed:", e.message); process.exit(1); });
