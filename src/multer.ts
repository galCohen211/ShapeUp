import multer, { StorageEngine } from "multer";
import fs from "fs";
import path from "path";

// Supported file types
const FILE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

// Ensure uploads are stored in a consistent location
const UPLOADS_DIR = path.join(process.cwd(), "src/uploads");

// Ensure the directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValid = FILE_TYPES[file.mimetype];
    const error: Error | null = isValid ? null : new Error("Invalid image type");

    cb(error, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.replace(/\.[^/.]+$/, "").replace(/ /g, "-");
    const fileExtension = FILE_TYPES[file.mimetype];
    const timestamp = new Date().toISOString().replace(/:/g, "_");

    cb(null, `${fileName}-${timestamp}.${fileExtension}`);
  },
});

const upload = multer({ storage });

export default upload;