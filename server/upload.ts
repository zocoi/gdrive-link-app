import express from "express";
import multer from "multer";
import path from "node:path";
import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";

// Configure basic auth guard (optional)
const sharedToken = process.env.UPLOAD_SHARED_TOKEN;

// Configure Google auth. Prefer GOOGLE_APPLICATION_CREDENTIALS env; falls back to local JSON.
const auth = new GoogleAuth({
  keyFile: "intrepid-pager-478901-b7-31f81e8013df.json",
  scopes: ["https://www.googleapis.com/auth/devstorage.full_control"],
});

const storage = google.storage({ version: "v1", auth });
const bucketName = process.env.GCS_BUCKET || "2025-link-app";
const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.use(express.json());

// Allow cross-origin requests (for local dev / LinkApp iframe)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});

// Simple bearer token guard if UPLOAD_SHARED_TOKEN is set
app.use((req, res, next) => {
  if (!sharedToken) return next();
  const header = req.headers.authorization;
  if (header === `Bearer ${sharedToken}`) return next();
  res.status(401).json({ error: "Unauthorized" });
});

// Upload to Google Cloud Storage (public-read) - keep legacy path name
app.post("/upload-to-drive", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    const prefix = req.body.prefix || process.env.GCS_PREFIX || "";
    const objectName = path.posix.join(
      prefix,
      `${Date.now()}-${req.file.originalname || "upload"}`,
    );

    const { data } = await storage.objects.insert({
      bucket: bucketName,
      name: objectName,
      uploadType: "media",
      predefinedAcl: "publicRead",
      media: {
        body: Buffer.from(req.file.buffer),
        mimeType: req.file.mimetype || "application/octet-stream",
      },
      fields: "name,mediaLink",
    });

    const publicUrl = `https://storage.googleapis.com/${encodeURIComponent(bucketName)}/${encodeURIComponent(
      data.name ?? objectName,
    )}`;

    res.json({ id: data.name ?? objectName, publicUrl });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("GCS upload failed", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    res.status(500).json({ error: message });
  }
});

// List images from GCS (public) - keep legacy path name
app.get("/list-drive-images", async (req, res) => {
  try {
    const prefix = (req.query.prefix as string | undefined) || process.env.GCS_PREFIX || "";

    const { data } = await storage.objects.list({
      bucket: bucketName,
      prefix,
      projection: "full",
      maxResults: 50,
    });

    const files =
      data.items?.map((file) => {
        const name = file.name ?? "";
        const publicUrl = `https://storage.googleapis.com/${encodeURIComponent(bucketName)}/${encodeURIComponent(
          name,
        )}`;
        return {
          id: name,
          name,
          webViewLink: publicUrl,
          thumbnailLink: publicUrl,
        };
      }) ?? [];

    res.json({ files });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("GCS list failed", error);
    const message = error instanceof Error ? error.message : "Listing failed";
    res.status(500).json({ error: message, files: [] });
  }
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Storage uploader listening on http://localhost:${port}`);
});
