const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const serviceRoute = require("./routes/serviceRoute");

// ✅ API route
app.use("/api/services", serviceRoute);

app.listen(4000, () => {
  console.log("Server running on port 4000");
});