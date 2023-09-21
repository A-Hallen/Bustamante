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

async function obtenerProveedoresConProductos(db, proveedores) {
  const proveedoresConProductos = [];

  const proveedoresPromises = Object.keys(proveedores).map(
    async (proveedorId) => {
      const proveedor = proveedores[proveedorId];
      const productosProveedor = proveedor.productos || {};

      const productos = await obtenerProductos(db, productosProveedor);

      proveedoresConProductos.push({
        proveedorId: proveedorId,
        nombre: proveedor.nombre,
        tipo: proveedor.tipo,
        productos: productos,
      });
    }
  );
  await Promise.all(proveedoresPromises);
  return proveedoresConProductos;
}

async function obtenerProductos(db, productosProveedor) {
  const productosKeys = Object.keys(productosProveedor).slice(0, 3);
  const productosPromises = productosKeys.map((productoId) => {
    const producto = productosProveedor[productoId];
    const productoRef = db.ref(`productos/${producto}`);

    return productoRef.once("value").then((snapshot) => {
      const productoData = snapshot.val();
      return productoData;
    });
  });

  const productos = await Promise.all(productosPromises);
  return productos;
}
