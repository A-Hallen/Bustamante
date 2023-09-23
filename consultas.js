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
      const productos = await obtenerProductos(db, productosProveedor);
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

async function obtenerProductos(db, productosProveedor) {
  const productosKeys = Object.keys(productosProveedor).slice(0, 3);
  const productosPromises = productosKeys.map((producto) => {
    const productoRef = db.ref(`productos/${producto}`);

    return productoRef.once("value").then((snapshot) => {
      const productoData = snapshot.val();
      return productoData;
    });
  });

  const productos = await Promise.all(productosPromises);
  return productos;
}
