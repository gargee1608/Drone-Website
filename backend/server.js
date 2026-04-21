const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const serviceRoute = require("./routes/serviceRoute");

// ✅ API route
app.use("/api/services", serviceRoute);


// ✅ LOGIN API (hardcoded demo — no database)
app.post("/api/auth/signin", (req, res) => {
  const email = String(req.body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password ?? "").trim();

  if (email === "test@gmail.com" && password === "test123") {
    return res.json({
      success: true,
      token: "dummy-token",
      role: "admin",
    });
  }

  return res.status(400).json({
    success: false,
    message: "Invalid credentials",
  });
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});