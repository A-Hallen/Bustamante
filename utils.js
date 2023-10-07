const https = require("https");

/**
 * Esta función sube un archivo y obtiene su url de descarga
 * @param {Express.Multer.File} file - El el archivo a subir.
 * @param {string} filePath - Ruta donde guardarlo en firebase.
 * @param {Bucket} bucket - El Bucket de firebase.
 * @returns {Promise<{string, string}>} - Una promesa
 */
exports.uploadFileGetUrl = function (file, filePath, bucket) {
  const blob = bucket.file(filePath);
  const blobStream = blob.createWriteStream();
  return new Promise((resolve, reject) => {
    blobStream.on("error", (error) => {
      reject(error);
    });

    blobStream.on("finish", async () => {
      // Obtiene la URL de la imagen subida
      const url = await blob.getSignedUrl({
        action: "read",
        expires: "03-01-2500", // Puedes ajustar la fecha de expiración según tus necesidades
      });
      const data = await blob.getMetadata();
      const hash = data[0].md5Hash;
      console.log("filepath: ", filePath);
      console.log("Hash del archivo:", hash);
      console.log("url del archivo: ", url);
      resolve({ url: url[0], hash: hash });
    });

    blobStream.end(file.buffer);
  });
};

exports.uploadFile = function (res, file, filePath, errorMessage, bucket) {
  const blob = bucket.file(filePath);
  const blobStream = blob.createWriteStream();

  blobStream.on("error", (error) => {
    console.log(error);
    res.status(500).send(errorMessage);
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
};

exports.nombreSinExtension = function (nombreArchivo) {
  const ultimoPunto = nombreArchivo.lastIndexOf(".");

  if (ultimoPunto === -1) {
    return nombreArchivo;
  } else {
    return nombreArchivo.substring(0, ultimoPunto);
  }
};

function getFileNameFromUrl(url) {
  const urlParts = url.split("/");
  const fileNameWithParams = urlParts[urlParts.length - 1];
  const fileName = fileNameWithParams.split("?")[0];
  const decodedFileName = decodeURIComponent(fileName);
  const fileNameWithoutPath = decodedFileName.split("/").pop();
  return fileNameWithoutPath;
}

function getFileNameFromHeaders(headers) {
  const contentDispositionHeader = headers["content-disposition"];

  if (contentDispositionHeader) {
    const match = contentDispositionHeader.match(
      /filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/i
    );
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
}

function eliminarUltimaVariable(url) {
  // Buscar el índice del último signo de interrogación
  const indiceInterrogacion = url.lastIndexOf("?");

  if (indiceInterrogacion !== -1) {
    // Obtener la parte de la URL antes del último signo de interrogación
    const urlSinParametros = url.substring(0, indiceInterrogacion);

    // Devolver la URL sin el último parámetro
    return urlSinParametros;
  }

  // La URL no tiene parámetros, devolverla intacta
  return url;
}

/**
 * @param String name
 * @return String
 */
function getParameterByName(name, url) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(url);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

exports.serveFile = function (url, res) {
  const options = {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0", // Agrega un User-Agent válido para evitar bloqueos o restricciones de algunos sitios web
    },
  };

  let firebaseUrl;
  let filename = getParameterByName("filename", url);
  if (filename) {
    firebaseUrl = eliminarUltimaVariable(url);
  } else {
    firebaseUrl = url;
  }
  const proxyRequest = https.request(firebaseUrl, options, (proxyResponse) => {
    // Configura los encabezados de respuesta adecuados
    if (filename) {
      let fullName = getFileNameFromHeaders(proxyResponse.headers);
      if (!fullName) {
        fullName = getFileNameFromUrl(url);
      }
      let extension = fullName.split(".").pop();

      res.set({
        "Content-Disposition": `attachment; filename="${filename}.${extension}"`,
        "Content-Type": proxyResponse.headers["content-type"],
      });
    } else {
      res.set(proxyResponse.headers);
    }

    proxyResponse.on("data", (chunk) => {
      res.write(chunk);
    });

    proxyResponse.on("end", () => {
      res.end();
    });
  });

  proxyRequest.on("error", (error) => {
    console.error(error);
    res.status(500).send("Error al obtener la imagen");
  });

  proxyRequest.end();
};
