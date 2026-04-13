/**
 * dgt-fix-tipos.mjs
 *
 * Corrige la clasificación de los códigos de tipo de vehículo que quedaron
 * como "otros" en la DB porque no estaban en la tabla original.
 *
 * Ejecutar UNA VEZ después de que --init haya terminado:
 *   node scripts/dgt-fix-tipos.mjs
 *
 * Luego regenerar JSON/TS:
 *   node scripts/dgt-matriculaciones.mjs --solo-agregar
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE   = join(__dirname, '..', 'data', 'dgt-matriculaciones.db');

// ─────────────────────────────────────────────────────────────────
// TABLA COMPLETA DE CÓDIGOS (incluye los desconocidos del --init)
// ─────────────────────────────────────────────────────────────────

// Remolques (R0–RE): plataforma, caja, cisterna, frigorífico,
//   batería, portacoches, ganado/vivo, cereal, hormigonera,
//   volquete, grúa, forestal, contra-incendios...
const REMOLQUES = [
  'R0','R1','R2','R3','R4','R5','R6','R7','R8','R9',
  'RA','RB','RC','RD','RE','RF','RG','RH','RI','RJ','RK',
];

// Semirremolques (S0–SE): mismas subcategorías que remolques
const SEMIRREMOLQUES = [
  'S0','S1','S2','S3','S4','S5','S6','S7','S8','S9',
  'SA','SB','SC','SD','SE','SF','SG','SH','SI','SJ','SK',
];

// Vehículos especiales adicionales (70-79, 7A-7F, 7G-7K)
const ESPECIALES_EXT = [
  '70','71','72','73','74','75','76','77','78','79',
  '7A','7B','7C','7D','7E','7F','7G','7H','7I','7J','7K',
];

// Maquinaria agrícola adicional
const AGRICOLA_EXT = [
  '56','57','58','59','5A','5B','5C','5D','5E','5F',
];

// Códigos numéricos desconocidos observados
// 81 = autocaravana / motorhome (>3500 kg)
// 82 = autocaravana ligera (<3500 kg)
// 83 = camping car
// 90 = quad ligero (L6e)
// 91 = quad pesado (L7e)
// 92 = triciclo motorizado (L5e)
// 00,01,02... = codigos legacy/históricos, probablemente vehiculos antiguos
const CODIGOS_EXTRA = {
  '80': { tipo: 'autocaravana',  grupo: 'especial'   },
  '81': { tipo: 'autocaravana',  grupo: 'especial'   },
  '82': { tipo: 'autocaravana',  grupo: 'especial'   },
  '83': { tipo: 'autocaravana',  grupo: 'especial'   },
  '90': { tipo: 'quad_atv',      grupo: 'quad_atv'   },
  '91': { tipo: 'quad_atv',      grupo: 'quad_atv'   },
  '92': { tipo: 'moto',          grupo: 'moto'        },
  '93': { tipo: 'moto',          grupo: 'moto'        },
  '79': { tipo: 'moto',          grupo: 'moto'        },
  '1A': { tipo: 'especial',      grupo: 'especial'   },
  '1B': { tipo: 'especial',      grupo: 'especial'   },
  '1C': { tipo: 'autobus',       grupo: 'autobus'    },
  '1D': { tipo: 'autobus',       grupo: 'autobus'    },
  '1E': { tipo: 'autobus',       grupo: 'autobus'    },
  '1F': { tipo: 'autobus',       grupo: 'autobus'    },
  // Códigos legacy (pre-normalización, probablemente vehículos importados o históricos)
  '00': { tipo: 'otros_legacy',  grupo: 'otros'      },
  '01': { tipo: 'otros_legacy',  grupo: 'otros'      },
  '02': { tipo: 'otros_legacy',  grupo: 'otros'      },
  '07': { tipo: 'otros_legacy',  grupo: 'otros'      },
  '08': { tipo: 'otros_legacy',  grupo: 'otros'      },
  '09': { tipo: 'otros_legacy',  grupo: 'otros'      },
  '0A': { tipo: 'otros_legacy',  grupo: 'otros'      },
  '0B': { tipo: 'otros_legacy',  grupo: 'otros'      },
  '0C': { tipo: 'otros_legacy',  grupo: 'otros'      },
  '0D': { tipo: 'otros_legacy',  grupo: 'otros'      },
  '0E': { tipo: 'otros_legacy',  grupo: 'otros'      },
  '0F': { tipo: 'otros_legacy',  grupo: 'otros'      },
  '0G': { tipo: 'otros_legacy',  grupo: 'otros'      },
};

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────

function main() {
  const db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  // Primero ver cuántos registros tienen tipo_grupo = 'otros'
  const { total_otros } = db.prepare(
    `SELECT COUNT(*) as total_otros FROM matriculaciones WHERE tipo_grupo = 'otros'`
  ).get();
  console.log(`Registros con tipo_grupo = 'otros': ${total_otros.toLocaleString()}`);

  // Ver qué códigos hay actualmente clasificados como 'otros'
  const codigosActuales = db.prepare(`
    SELECT cod_tipo, COUNT(*) as n
    FROM matriculaciones
    WHERE tipo_grupo = 'otros' AND cod_tipo IS NOT NULL
    GROUP BY cod_tipo
    ORDER BY n DESC
  `).all();

  console.log(`\nCódigos únicos en 'otros': ${codigosActuales.length}`);
  console.log('Top 20:');
  codigosActuales.slice(0, 20).forEach(r =>
    console.log(`  ${r.cod_tipo.padEnd(4)} → ${r.n.toLocaleString()}`)
  );

  const updateStmt = db.prepare(`
    UPDATE matriculaciones
    SET tipo_vehiculo = ?, tipo_grupo = ?
    WHERE cod_tipo = ? AND tipo_grupo = 'otros'
  `);

  const runUpdates = db.transaction(() => {
    let totalActualizados = 0;

    // Remolques
    for (const cod of REMOLQUES) {
      const { changes } = updateStmt.run('remolque', 'remolque', cod);
      totalActualizados += changes;
    }

    // Semirremolques
    for (const cod of SEMIRREMOLQUES) {
      const { changes } = updateStmt.run('semirremolque', 'remolque', cod);
      totalActualizados += changes;
    }

    // Vehículos especiales extendidos
    for (const cod of ESPECIALES_EXT) {
      const { changes } = updateStmt.run('especial', 'especial', cod);
      totalActualizados += changes;
    }

    // Maquinaria agrícola extendida
    for (const cod of AGRICOLA_EXT) {
      const { changes } = updateStmt.run('maquinaria_agricola', 'agricola', cod);
      totalActualizados += changes;
    }

    // Códigos extra con clasificación específica
    for (const [cod, { tipo, grupo }] of Object.entries(CODIGOS_EXTRA)) {
      const { changes } = updateStmt.run(tipo, grupo, cod);
      totalActualizados += changes;
    }

    return totalActualizados;
  });

  console.log('\n🔧 Aplicando correcciones...');
  const actualizados = runUpdates();
  console.log(`✓ ${actualizados.toLocaleString()} registros actualizados`);

  // Ver cuántos quedan sin clasificar
  const { restantes } = db.prepare(
    `SELECT COUNT(*) as restantes FROM matriculaciones WHERE tipo_grupo = 'otros'`
  ).get();
  console.log(`  Registros que siguen como 'otros': ${restantes.toLocaleString()}`);

  if (restantes > 0) {
    const sinClasificar = db.prepare(`
      SELECT cod_tipo, COUNT(*) as n
      FROM matriculaciones
      WHERE tipo_grupo = 'otros' AND cod_tipo IS NOT NULL
      GROUP BY cod_tipo
      ORDER BY n DESC
      LIMIT 20
    `).all();
    console.log('  Códigos sin clasificar:');
    sinClasificar.forEach(r =>
      console.log(`    ${r.cod_tipo.padEnd(4)} → ${r.n.toLocaleString()}`)
    );
  }

  db.close();
  console.log('\n✅ Listo. Ahora regenerá el JSON/TS:');
  console.log('   node scripts/dgt-matriculaciones.mjs --solo-agregar');
}

main();
