import dotenv from "dotenv";
import path from "path";

// Load environment variables based on the current environment
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(__dirname, "../.env.local") });
} else {
  dotenv.config();
}
