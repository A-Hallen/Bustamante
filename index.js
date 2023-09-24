const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3030;
const consultas = require("./consultas");
const utils = require("./utils");

const cors = require("cors");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

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

app.get("/productos", (req, res) => {
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

app.post("/upload-image", upload.single("image"), (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).send("No se ha enviado ninguna imagen");
    return;
  }
  const currentDate = new Date();
  const extension = file.originalname.split(".").pop();
  const filePath = `imagenes/${currentDate.getTime()}.${extension}`;

  const blob = bucket.file(filePath);
  const blobStream = blob.createWriteStream();

  blobStream.on("error", (error) => {
    console.log(error);
    res.status(500).send("Error al subir la imagen");
  });

  blobStream.on("finish", async () => {
    // Obtiene la URL de la imagen subida
    const url = await blob.getSignedUrl({
      action: "read",
      expires: "03-01-2500", // Puedes ajustar la fecha de expiración según tus necesidades
    });
    res.status(200).send(url[0]);
  });

  blobStream.end(file.buffer);
});

app.post("/upload-product", (req, res) => {
  const producto = req.body;
  const productosRef = db.ref("productos");
  const proveedoresRef = db.ref("proveedores");
  const proveedorRef = proveedoresRef.child(producto.proveedorId);
  const nuevoProductoId = productosRef.push().key;
  proveedorRef
    .child("productos")
    .transaction((productos) => {
      if (productos === null) {
        return { [nuevoProductoId]: true };
      } else {
        productos[nuevoProductoId] = true;
        return productos;
      }
    })
    .then((transactionResult) => {
      if (transactionResult.committed) {
        console.log("Elemento agregado correctamente");
      } else {
        console.log("La transacción fue abortada");
      }
    })
    .catch((error) => {
      console.error("Error al agregar el elemento:", error);
    });
  const nuevoProductoRef = productosRef.child(nuevoProductoId);
  nuevoProductoRef
    .set(producto)
    .then(() => {
      res.send("error");
    })
    .catch((error) => {
      console.error("Error al crear el nuevo producto:", error);
      res.send("OK");
    });
});

app.get("/productos-list", (req, res) => {
  consultas
    .getProductosList(db)
    .then((productosConProveedor) => {
      res.send(productosConProveedor);
    })
    .catch((error) => {
      res.status(500).send("Error en la consulta de productos");
    });
});

app.get("/firebasestorage.googleapis.com/*", (req, res) => {
  const url = "https:/" + req.originalUrl;
  utils.serveFile(url, res, true);
});

app.get("/storage.googleapis.com/*", (req, res) => {
  const url = `https:/${req.originalUrl}`;
  utils.serveFile(url, res);
});

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
