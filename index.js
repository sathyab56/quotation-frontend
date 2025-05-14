import express from "express";
import "dotenv/config";
import cors from "cors";
import { configs } from "./configs/env.js";
import defaultrouter from "./routes/routes.js";
import { sequelize } from "./configs/db.js";

const app = express();

// ✅ Allowed origins
const allowedOrigins = [
  "https://quotation-frontend-mocha.vercel.app",
  "http://localhost:8000",
  "http://localhost:3000"
];

// ✅ CORS setup
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked request from: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// ✅ JSON parser (modern)
app.use(express.json());

// ✅ Route setup
app.use("/", defaultrouter);

// ✅ 404 route
app.use((req, res) => {
  res.status(404).json({ error: "Resource not found" });
});

// ✅ Server start
const port = configs.port || process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`✅ Server is running on port: ${port}`);
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");
  } catch (error) {
    console.error("❌ DB connection error:", error.message);
  }
});

export default app;
