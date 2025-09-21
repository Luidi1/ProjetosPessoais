import dotenv from "dotenv";

dotenv.config({
  path:
    process.env.NODE_ENV === "test"
      ? ".env.test"
      : process.env.NODE_ENV === "production"
        ? ".env.prod"
        : ".env",  // development
  override: true
});
