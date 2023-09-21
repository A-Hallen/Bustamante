const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3030;
const consultas = require("./consultas");

// firebase
// Import the functions you need from the SDKs you need
const admin = require("firebase-admin");
const serviceAccount = require("./bustamante-8474c-8ce6296abb9e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://bustamante-8474c.appspot.com",
  databaseURL: "https://bustamante-8474c-default-rtdb.firebaseio.com/",
});

const db = admin.database();

// firebase

// storage
const storage = admin.storage();

const bucket = storage.bucket();
// storage

const buildpath = path.join(__dirname, "client", "build");

app.use(express.static(buildpath));

app.get("/", (req, res) => {
  res.sendFile(path.join(buildpath, "index.html"));
});

app.get("/proveedores", (req, res) => {
  res.sendFile(path.join(buildpath, "index.html"));
});

app.get("/download/:filename(*)", (req, res) => {
  const filename = req.params.filename;
  const fileRef = bucket.file(filename);
  const stream = fileRef.createReadStream();
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  stream.pipe(res);
});

app.get("/proveedores-list", (req, res) => {
  consultas
    .getProveedoresList(db)
    .then((proveedoresConProductos) => {
      res.send(proveedoresConProductos);
    })
    .catch((error) => {
      res.status(500).send("Error en la consulta de proveedores");
    });
});

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
