// ─── server.js — QuizIQ Express Server Entry Point ───────────────────────────
import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5200;

// Connect to MongoDB then start the HTTP server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🧠 QuizIQ API running on http://localhost:${PORT}`);
      console.log(`   Environment : ${process.env.NODE_ENV}`);
      console.log(`   MongoDB     : connected\n`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
