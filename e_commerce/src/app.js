import express from "express";
import dbConnect from "./config/dbConnect.js";

await dbConnect();
const app = express();

export default app;