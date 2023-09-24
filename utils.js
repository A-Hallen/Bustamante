const https = require("https");

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

exports.serveFile = function (url, res, download = false) {
  const options = {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0", // Agrega un User-Agent válido para evitar bloqueos o restricciones de algunos sitios web
    },
  };

  const proxyRequest = https.request(url, options, (proxyResponse) => {
    // Configura los encabezados de respuesta adecuados
    if (download) {
      let filename = getFileNameFromHeaders(proxyResponse.headers);
      if (!filename) {
        filename = getFileNameFromUrl(url);
      }
      res.set({
        "Content-Disposition": `attachment; filename="${filename}"`,
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
