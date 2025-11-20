import express from "express";
import multer from "multer";
import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";

// Configure basic auth guard (optional)
const sharedToken = process.env.UPLOAD_SHARED_TOKEN;

// Configure Google auth. Prefer GOOGLE_APPLICATION_CREDENTIALS env; falls back to local JSON.
const auth = new GoogleAuth({
  keyFile:
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    "client_secret_1005062320352-ogsglai8r17ec5rq89jc3klh3ran2ecq.apps.googleusercontent.com.json",
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});

const drive = google.drive({ version: "v3", auth });
const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.use(express.json());

// Simple bearer token guard if UPLOAD_SHARED_TOKEN is set
app.use((req, res, next) => {
  if (!sharedToken) return next();
  const header = req.headers.authorization;
  if (header === `Bearer ${sharedToken}`) return next();
  res.status(401).json({ error: "Unauthorized" });
});

app.post("/upload-to-drive", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    const folderId =
      req.body.folderId ||
      process.env.DEFAULT_DRIVE_FOLDER_ID ||
      "1iPuycVFc4gtdgDnAESXEvqod4sN7R7xU";

    const { data } = await drive.files.create({
      requestBody: {
        name: req.file.originalname || "upload",
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType: req.file.mimetype || "application/octet-stream",
        body: Buffer.from(req.file.buffer),
      },
      fields: "id, webViewLink",
      supportsAllDrives: true,
    });

    // Make file public (anyone with the link)
    if (data.id) {
      await drive.permissions.create({
        fileId: data.id,
        requestBody: {
          role: "reader",
          type: "anyone",
          allowFileDiscovery: false,
        },
        supportsAllDrives: true,
      });
    }

    res.json({ id: data.id, webViewLink: data.webViewLink });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Drive upload failed", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    res.status(500).json({ error: message });
  }
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Drive uploader listening on http://localhost:${port}`);
});
