exports.obtenerFechaDeUltimaActualizacion = function (fechaSolicitada, db) {
  return new Promise((resolve, reject) => {
    const dateRef = db.ref(`updatetime/${fechaSolicitada}`);

    dateRef.once(
      "value",
      (snapshot) => {
        resolve(snapshot.val());
        return snapshot.val();
      },
      (error) => {
        reject(error);
      }
    );
  });
};

exports.actualizarFecha = function (fechaSolicitada, db) {
  return new Promise((resolve, reject) => {
    const dateRef = db.ref(`updatetime/${fechaSolicitada}`);
    let fechaActual = new Date().toISOString();

    dateRef
      .set(fechaActual)
      .then(() => {
        resolve(`Nueva fecha agregada: ${fechaActual}`);
      })
      .catch((error) => {
        reject(`Error: ${error}`);
      });
  });
};

exports.getProductosList = function (db) {
  const productosRef = db.ref("productos");

  return productosRef
    .once("value")
    .then(async (snapshot) => {
      const productos = snapshot.val();
      const productosConProveedor = await obtenerProductosConProveedor(
        db,
        productos
      );
      return productosConProveedor;
    })
    .catch((error) => {
      console.error("Error al consultar los productos y el proveedor");
      throw error;
    });
};

// Definir la función para obtener los productos con ID igual a 1
exports.getProductListByProveedorId = function (id, db) {
  return new Promise((resolve, reject) => {
    // Crea una referencia a la lista de productos
    const productosRef = db.ref("productos");

    // Realiza la consulta a la base de datos
    productosRef
      .once("value")
      .then((snapshot) => {
        const productos = snapshot.val();

        // Filtra los productos con proveedorId igual a 1
        const productosConProveedorId1 = Object.values(productos).filter(
          (producto) => {
            return producto.proveedorId == id;
          }
        );

        resolve(productosConProveedorId1);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

exports.getProveedoresList = function (db) {
  const proveedoresRef = db.ref("proveedores"); // Se obtiene una referencia a la colección "proveedores" en la bd.

  return proveedoresRef
    .once("value")
    .then(async (snapshot) => {
      const proveedores = snapshot.val();
      const proveedoresConProductos = await obtenerProveedoresConProductos(
        db,
        proveedores
      );
      return proveedoresConProductos;
    })
    .catch((error) => {
      console.error("Error al consultar los proveedores y productos:", error);
      throw error;
    });
};

async function obtenerProductosConProveedor(db, productos) {
  const productosConProveedor = [];
  const productosPromise = Object.keys(productos).map(async (productoId) => {
    const producto = productos[productoId];
    const proveedor = await obtenerProveedor(db, producto.proveedorId);
    productosConProveedor.push({
      id: productoId,
      ...producto,
      nombreProveedor: proveedor.nombre,
      tipoProveedor: proveedor.tipo,
    });
  });
  await Promise.all(productosPromise);
  return productosConProveedor;
}

async function obtenerProveedoresConProductos(db, proveedores) {
  const proveedoresConProductos = [];

  const proveedoresPromises = Object.keys(proveedores).map(
    async (proveedorId) => {
      const proveedor = proveedores[proveedorId];
      const productosProveedor = proveedor.productos || {};
      const productos = await obtenerProductos(
        db,
        productosProveedor,
        proveedor
      );
      proveedoresConProductos.push({
        proveedorId: proveedorId,
        informacion: proveedor.informacion,
        nombre: proveedor.nombre,
        tipo: proveedor.tipo,
        productos: productos,
      });
    }
  );
  await Promise.all(proveedoresPromises);
  return proveedoresConProductos;
}
async function obtenerProveedor(db, productoId) {
  const proveedoresRef = db.ref(`proveedores/${productoId}`);
  const snapshot = await proveedoresRef.once("value");
  const proveedorData = snapshot.val();
  return proveedorData;
}

async function obtenerProductos(db, productosProveedor, proveedor) {
  const productosKeys = Object.keys(productosProveedor).slice(0, 3);
  const productosPromises = productosKeys.map((producto) => {
    const productoRef = db.ref(`productos/${producto}`);

    return productoRef.once("value").then((snapshot) => {
      const productoData = snapshot.val();
      productoData.id = producto;
      productoData.nombreProveedor = proveedor.nombre;
      productoData.tipoProveedor = proveedor.tipo;
      return productoData;
    });
  });

  const productos = await Promise.all(productosPromises);
  return productos;
}
