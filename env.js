import dotenv from "dotenv";

// Load environment variables based on the current environment
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.local" });
} else {
  dotenv.config();
}
