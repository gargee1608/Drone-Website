client.connect()
  .then(() => console.log("Database Connected ✅"))
  .catch(err => console.error(err));

  const express = require("express");
  const app = express();
  
  app.use(express.json());
  
  // Home route
  app.get("/", (req, res) => {
    res.send("Backend Running 🚀");
  });
  
  // TEST API
  app.get("/test", (req, res) => {
    res.send("API Working ✅");
  });
  
  app.listen(5000, () => {
    console.log("Server running on port 5000");
  });