// Quick test: what does /markers return at different zoom levels for Madrid?
const MADRID_BBOX = { latitude_ne: 40.92, longitude_ne: -3.05, latitude_sw: 39.87, longitude_sw: -4.58 };
const SPAIN_BBOX  = { latitude_ne: 43.9, longitude_ne: 4.4, latitude_sw: 35.9, longitude_sw: -9.4 };

async function markers(bbox, zoom) {
  const r = await fetch("https://www.mapareve.es/api/public/v1/markers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...bbox, zoom, cpo_ids: [], only_ocpi: false, available: false, connector_types: [], payment_methods: [], facilities: [], latitude: null, longitude: null }),
  });
  return r.json();
}

// Test Madrid at various zoom levels
for (const zoom of [8, 10, 12, 14]) {
  const data = await markers(MADRID_BBOX, zoom);
  const total = data.reduce((s, d) => s + (d.total_evse ?? 1), 0);
  console.log(`Madrid zoom=${zoom}: ${data.length} features, total_evse=${total}, types=${[...new Set(data.map(d=>d.type))].join(",")}`);
}

// Test all-Spain at zoom=8 to see granularity
const spain8 = await markers(SPAIN_BBOX, 8);
console.log(`\nSpain zoom=8: ${spain8.length} features`);
const types8 = [...new Set(spain8.map(d => d.type))];
console.log("Types:", types8);
spain8.slice(0, 5).forEach(d => console.log(" ", JSON.stringify(d)));
