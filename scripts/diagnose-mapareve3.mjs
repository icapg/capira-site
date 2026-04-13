/**
 * diagnose-mapareve3.mjs
 * Llama directamente a la API de markers con zoom alto para ver cargadores individuales con estado.
 * Prueba diferentes niveles de zoom sobre Barcelona.
 */

const BASE = "https://www.mapareve.es/api/public/v1";
const HEADERS = {
  "accept": "application/json",
  "content-type": "application/json",
  "app-version": "1.10.0",
  "platform": "web",
  "time-zone": "Europe/Madrid",
  "referer": "https://www.mapareve.es/mapa-puntos-recarga",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
};

// Barcelona bounding box a diferentes zooms
const BARCELONA = {
  zoom14: { lat_ne: 41.430, lon_ne: 2.230, lat_sw: 41.360, lon_sw: 2.100 },
  zoom12: { lat_ne: 41.470, lon_ne: 2.280, lat_sw: 41.330, lon_sw: 2.050 },
  zoom10: { lat_ne: 41.550, lon_ne: 2.400, lat_sw: 41.250, lon_sw: 1.900 },
};

async function queryMarkers(bbox, zoom) {
  const body = {
    latitude_ne: bbox.lat_ne,
    longitude_ne: bbox.lon_ne,
    latitude_sw: bbox.lat_sw,
    longitude_sw: bbox.lon_sw,
    zoom,
    cpo_ids: [],
    only_ocpi: false,
    available: false,
    connector_types: [],
    payment_methods: [],
    facilities: [],
    latitude: null,
    longitude: null,
  };

  const res = await fetch(`${BASE}/markers`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  return res.json();
}

// Probar distintos zooms
for (const [label, bbox] of Object.entries(BARCELONA)) {
  const zoom = parseInt(label.replace("zoom", ""));
  const data = await queryMarkers(bbox, zoom);
  console.log(`\n=== Zoom ${zoom} (${label}) ===`);
  console.log(`Total items: ${data.length}`);
  if (data.length > 0) {
    console.log(`Tipos: ${[...new Set(data.map(d => d.type))].join(", ")}`);
    const individual = data.filter(d => d.type !== "cluster");
    const clusters = data.filter(d => d.type === "cluster");
    console.log(`  Clusters: ${clusters.length}`);
    console.log(`  Individuales: ${individual.length}`);
    if (individual.length > 0) {
      console.log("\nEjemplo cargador individual:");
      console.log(JSON.stringify(individual[0], null, 2));
    }
    if (clusters.length > 0) {
      console.log("\nEjemplo cluster:");
      console.log(JSON.stringify(clusters[0], null, 2));
    }
  }
}

// También probar el endpoint de un cargador individual si existe
// Buscar a zoom muy alto (18) sobre una zona pequeña de Barcelona centro
const SMALL_BBOX = { lat_ne: 41.392, lon_ne: 2.175, lat_sw: 41.382, lon_sw: 2.160 };
const highZoom = await queryMarkers(SMALL_BBOX, 18);
console.log(`\n=== Zoom 18 (Barcelona centro muy pequeño) ===`);
console.log(`Total items: ${highZoom.length}`);
if (highZoom.length > 0) {
  console.log("Primer item completo:");
  console.log(JSON.stringify(highZoom[0], null, 2));
  console.log("\nTodos los campos disponibles:", Object.keys(highZoom[0]).join(", "));
}

console.log("\n✅ Done");
