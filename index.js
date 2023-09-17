const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3030;

const buildpath = path.join(__dirname, "client", "build");

app.use(express.static(buildpath));

app.get("/", (req, res) => {
  res.sendFile(path.join(buildpath, "index.html"));
});

app.get("/proveedores", (req, res) => {
  res.sendFile(path.join(buildpath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
