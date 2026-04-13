const Database = require('better-sqlite3');
const db = new Database('data/dgt-matriculaciones.db', { readonly: true });
const aedive = JSON.parse(require('fs').readFileSync('scripts/screenshots/aedive-data-2026-04-10.json','utf8'));
const MESES = {'Enero':1,'Febrero':2,'Marzo':3,'Abril':4,'Mayo':5,'Junio':6,'Julio':7,'Agosto':8,'Septiembre':9,'Octubre':10,'Noviembre':11,'Diciembre':12};

const sAll  = db.prepare("SELECT COUNT(*) as n FROM matriculaciones WHERE año=? AND mes=? AND cat_vehiculo_ev=?");
const sTur  = db.prepare("SELECT COUNT(*) as n FROM matriculaciones WHERE año=? AND mes=? AND cat_vehiculo_ev=? AND tipo_grupo='turismo'");
const sTurSuv = db.prepare("SELECT COUNT(*) as n FROM matriculaciones WHERE año=? AND mes=? AND cat_vehiculo_ev=? AND tipo_grupo IN ('turismo','suv_todo_terreno')");

let t0=0, tAll=0, tTur=0, tTurSuv=0;
for (const [a, mm] of Object.entries(aedive))
  for (const [mn, vv] of Object.entries(mm)) {
    const m = MESES[mn];
    for (const [c, v] of Object.entries(vv)) {
      t0     += v;
      tAll   += sAll.get(+a, m, c).n;
      tTur   += sTur.get(+a, m, c).n;
      tTurSuv+= sTurSuv.get(+a, m, c).n;
    }
  }

const p = (a, b) => ((a-b)/b*100).toFixed(2) + '%';
console.log('AEDIVE total:         ', t0.toLocaleString());
console.log('DGT todos los tipos:  ', tAll.toLocaleString(),   '  diff:', p(tAll,    t0));
console.log('DGT solo turismo:     ', tTur.toLocaleString(),   '  diff:', p(tTur,    t0));
console.log('DGT turismo+suv:      ', tTurSuv.toLocaleString(),'  diff:', p(tTurSuv, t0));
db.close();
