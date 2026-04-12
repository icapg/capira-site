// ─── AUTO-GENERADO ─────────────────────────────────────────────────────────
// Genera: node scripts/dgt-parque.mjs
// Fuente: DGT - Microdatos de Matriculaciones + Bajas (MATRABA)
// Última actualización: 2026-04-12
// ⚠️  No editar manualmente
// ────────────────────────────────────────────────────────────────────────────

export type ParqueCatEv = {
  BEV?:  number;
  PHEV?: number;
  HEV?:  number;
  REEV?: number;
  FCEV?: number;
};

export type ParqueTipoGrupo = {
  turismo?:         ParqueCatEv;
  suv_todo_terreno?: ParqueCatEv;
  furgoneta_van?:   ParqueCatEv;
  moto?:            ParqueCatEv;
  camion?:          ParqueCatEv;
  autobus?:         ParqueCatEv;
  especial?:        ParqueCatEv;
  otros?:           ParqueCatEv;
};

export type ParqueMes = {
  periodo:           string;
  matriculaciones_mes: ParqueCatEv;
  bajas_mes:           ParqueCatEv;
  parque_acumulado:    ParqueCatEv;
  parque_por_tipo?:    ParqueTipoGrupo;
};

export type ParqueResumenCat = {
  matriculadas:  number;
  bajas:         number;
  parque_activo: number;
  tasa_baja_pct: number;
};

export const dgtParqueMeta = {
  ultimo_periodo:       "2026-02",
  ultima_actualizacion: "2026-04-12",
} as const;

export const dgtParqueResumen: Record<string, ParqueResumenCat> = {
  "BEV": {
    "matriculadas": 487915,
    "bajas": 81913,
    "parque_activo": 447171,
    "tasa_baja_pct": 16.79
  },
  "PHEV": {
    "matriculadas": 431582,
    "bajas": 49732,
    "parque_activo": 400928,
    "tasa_baja_pct": 11.52
  },
  "HEV": {
    "matriculadas": 2191084,
    "bajas": 303014,
    "parque_activo": 2090795,
    "tasa_baja_pct": 13.83
  },
  "REEV": {
    "matriculadas": 2740,
    "bajas": 757,
    "parque_activo": 2843,
    "tasa_baja_pct": 27.63
  },
  "FCEV": {
    "matriculadas": 144,
    "bajas": 8,
    "parque_activo": 139,
    "tasa_baja_pct": 5.56
  }
};

export const dgtParqueResumenPorTipo: Record<string, Record<string, { matriculadas: number; bajas: number; parque_activo: number }>> = {
  "turismo": {
    "BEV": {
      "matriculadas": 346865,
      "bajas": 41977,
      "parque_activo": 336195
    },
    "PHEV": {
      "matriculadas": 375197,
      "bajas": 42397,
      "parque_activo": 349053
    },
    "HEV": {
      "matriculadas": 2099443,
      "bajas": 290933,
      "parque_activo": 2001718
    }
  },
  "suv_todo_terreno": {
    "BEV": {
      "matriculadas": 98,
      "bajas": 2,
      "parque_activo": 104
    },
    "HEV": {
      "matriculadas": 480,
      "bajas": 4,
      "parque_activo": 532
    }
  },
  "furgoneta_van": {
    "BEV": {
      "matriculadas": 102,
      "bajas": 6,
      "parque_activo": 104
    },
    "PHEV": {
      "matriculadas": 51062,
      "bajas": 6879,
      "parque_activo": 46930
    },
    "HEV": {
      "matriculadas": 74389,
      "bajas": 10364,
      "parque_activo": 71571
    }
  },
  "moto": {
    "BEV": {
      "matriculadas": 60194,
      "bajas": 24370,
      "parque_activo": 41275
    },
    "PHEV": {
      "matriculadas": 13,
      "bajas": 43,
      "parque_activo": 0
    },
    "HEV": {
      "matriculadas": 429,
      "bajas": 116,
      "parque_activo": 356
    }
  },
  "camion": {
    "BEV": {
      "matriculadas": 26100,
      "bajas": 3242,
      "parque_activo": 25480
    },
    "PHEV": {
      "matriculadas": 2532,
      "bajas": 32,
      "parque_activo": 2536
    },
    "HEV": {
      "matriculadas": 9062,
      "bajas": 884,
      "parque_activo": 9252
    }
  },
  "autobus": {
    "BEV": {
      "matriculadas": 2486,
      "bajas": 0,
      "parque_activo": 2795
    },
    "PHEV": {
      "matriculadas": 3,
      "bajas": 0,
      "parque_activo": 3
    },
    "HEV": {
      "matriculadas": 24,
      "bajas": 0,
      "parque_activo": 27
    }
  },
  "especial": {
    "BEV": {
      "matriculadas": 8770,
      "bajas": 15,
      "parque_activo": 9846
    },
    "PHEV": {
      "matriculadas": 49,
      "bajas": 11,
      "parque_activo": 40
    },
    "HEV": {
      "matriculadas": 624,
      "bajas": 92,
      "parque_activo": 592
    }
  },
  "otros": {
    "BEV": {
      "matriculadas": 5720,
      "bajas": 1988,
      "parque_activo": 4105
    },
    "PHEV": {
      "matriculadas": 2717,
      "bajas": 346,
      "parque_activo": 2413
    },
    "HEV": {
      "matriculadas": 6626,
      "bajas": 618,
      "parque_activo": 6743
    }
  }
};

export const dgtParqueMensual: ParqueMes[] = [
  {
    "periodo": "2014-12",
    "matriculaciones_mes": {
      "BEV": 283,
      "PHEV": 51,
      "HEV": 502,
      "REEV": 15
    },
    "bajas_mes": {
      "BEV": 96,
      "PHEV": 13,
      "HEV": 115
    },
    "parque_acumulado": {
      "BEV": 41356,
      "PHEV": 19116,
      "HEV": 203112,
      "REEV": 875,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 31428,
        "PHEV": 16286,
        "HEV": 193596
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 56
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2753,
        "HEV": 7545
      },
      "moto": {
        "BEV": 5457,
        "HEV": 43
      },
      "camion": {
        "BEV": 2679,
        "PHEV": 36,
        "HEV": 1074
      },
      "autobus": {
        "BEV": 311,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1091,
        "PHEV": 2,
        "HEV": 60
      },
      "otros": {
        "BEV": 374,
        "PHEV": 42,
        "HEV": 735
      }
    }
  },
  {
    "periodo": "2015-01",
    "matriculaciones_mes": {
      "BEV": 98,
      "PHEV": 11,
      "HEV": 544,
      "REEV": 4
    },
    "bajas_mes": {
      "BEV": 20,
      "PHEV": 19,
      "HEV": 84
    },
    "parque_acumulado": {
      "BEV": 41434,
      "PHEV": 19108,
      "HEV": 203572,
      "REEV": 879,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 31471,
        "PHEV": 16274,
        "HEV": 194048
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 56
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2755,
        "HEV": 7549
      },
      "moto": {
        "BEV": 5470,
        "HEV": 43
      },
      "camion": {
        "BEV": 2686,
        "PHEV": 36,
        "HEV": 1075
      },
      "autobus": {
        "BEV": 312,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1091,
        "PHEV": 2,
        "HEV": 63
      },
      "otros": {
        "BEV": 374,
        "PHEV": 42,
        "HEV": 735
      }
    }
  },
  {
    "periodo": "2015-02",
    "matriculaciones_mes": {
      "BEV": 121,
      "PHEV": 19,
      "HEV": 431,
      "REEV": 5
    },
    "bajas_mes": {
      "BEV": 28,
      "PHEV": 14,
      "HEV": 115
    },
    "parque_acumulado": {
      "BEV": 41527,
      "PHEV": 19113,
      "HEV": 203888,
      "REEV": 884,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 31487,
        "PHEV": 16275,
        "HEV": 194360
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 56
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2759,
        "HEV": 7552
      },
      "moto": {
        "BEV": 5531,
        "HEV": 43
      },
      "camion": {
        "BEV": 2693,
        "PHEV": 36,
        "HEV": 1075
      },
      "autobus": {
        "BEV": 315,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1091,
        "PHEV": 2,
        "HEV": 64
      },
      "otros": {
        "BEV": 374,
        "PHEV": 42,
        "HEV": 735
      }
    }
  },
  {
    "periodo": "2015-03",
    "matriculaciones_mes": {
      "BEV": 202,
      "PHEV": 27,
      "HEV": 539,
      "REEV": 2
    },
    "bajas_mes": {
      "BEV": 32,
      "PHEV": 7,
      "HEV": 98
    },
    "parque_acumulado": {
      "BEV": 41697,
      "PHEV": 19133,
      "HEV": 204329,
      "REEV": 886,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 31606,
        "PHEV": 16291,
        "HEV": 194800
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 56
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2761,
        "HEV": 7552
      },
      "moto": {
        "BEV": 5539,
        "HEV": 43
      },
      "camion": {
        "BEV": 2710,
        "PHEV": 38,
        "HEV": 1075
      },
      "autobus": {
        "BEV": 316,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1091,
        "PHEV": 2,
        "HEV": 65
      },
      "otros": {
        "BEV": 377,
        "PHEV": 42,
        "HEV": 735
      }
    }
  },
  {
    "periodo": "2015-04",
    "matriculaciones_mes": {
      "BEV": 119,
      "PHEV": 44,
      "HEV": 526,
      "REEV": 6
    },
    "bajas_mes": {
      "BEV": 28,
      "PHEV": 8,
      "HEV": 167
    },
    "parque_acumulado": {
      "BEV": 41788,
      "PHEV": 19169,
      "HEV": 204688,
      "REEV": 892,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 31651,
        "PHEV": 16323,
        "HEV": 195163
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 56
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2765,
        "HEV": 7549
      },
      "moto": {
        "BEV": 5549,
        "HEV": 43
      },
      "camion": {
        "BEV": 2738,
        "PHEV": 38,
        "HEV": 1074
      },
      "autobus": {
        "BEV": 320,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1091,
        "PHEV": 2,
        "HEV": 65
      },
      "otros": {
        "BEV": 376,
        "PHEV": 42,
        "HEV": 735
      }
    }
  },
  {
    "periodo": "2015-05",
    "matriculaciones_mes": {
      "BEV": 113,
      "PHEV": 52,
      "HEV": 513,
      "REEV": 13
    },
    "bajas_mes": {
      "BEV": 38,
      "PHEV": 5,
      "HEV": 120
    },
    "parque_acumulado": {
      "BEV": 41863,
      "PHEV": 19216,
      "HEV": 205081,
      "REEV": 905,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 31692,
        "PHEV": 16365,
        "HEV": 195553
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 56
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2770,
        "HEV": 7550
      },
      "moto": {
        "BEV": 5572,
        "HEV": 44
      },
      "camion": {
        "BEV": 2746,
        "PHEV": 39,
        "HEV": 1074
      },
      "autobus": {
        "BEV": 325,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1091,
        "PHEV": 2,
        "HEV": 66
      },
      "otros": {
        "BEV": 376,
        "PHEV": 42,
        "HEV": 735
      }
    }
  },
  {
    "periodo": "2015-06",
    "matriculaciones_mes": {
      "BEV": 157,
      "PHEV": 43,
      "HEV": 703,
      "REEV": 14
    },
    "bajas_mes": {
      "BEV": 33,
      "PHEV": 10,
      "HEV": 129,
      "REEV": 1
    },
    "parque_acumulado": {
      "BEV": 41987,
      "PHEV": 19249,
      "HEV": 205655,
      "REEV": 918,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 31748,
        "PHEV": 16395,
        "HEV": 196127
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 56
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2775,
        "HEV": 7550
      },
      "moto": {
        "BEV": 5605,
        "HEV": 44
      },
      "camion": {
        "BEV": 2762,
        "PHEV": 39,
        "HEV": 1074
      },
      "autobus": {
        "BEV": 326,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1091,
        "PHEV": 2,
        "HEV": 66
      },
      "otros": {
        "BEV": 377,
        "PHEV": 42,
        "HEV": 735
      }
    }
  },
  {
    "periodo": "2015-07",
    "matriculaciones_mes": {
      "BEV": 236,
      "PHEV": 93,
      "HEV": 992,
      "REEV": 3
    },
    "bajas_mes": {
      "BEV": 37,
      "PHEV": 8,
      "HEV": 127
    },
    "parque_acumulado": {
      "BEV": 42186,
      "PHEV": 19334,
      "HEV": 206520,
      "REEV": 921,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 31826,
        "PHEV": 16472,
        "HEV": 196986
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 56
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2784,
        "HEV": 7555
      },
      "moto": {
        "BEV": 5612,
        "HEV": 44
      },
      "camion": {
        "BEV": 2803,
        "PHEV": 39,
        "HEV": 1075
      },
      "autobus": {
        "BEV": 342,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1091,
        "PHEV": 2,
        "HEV": 66
      },
      "otros": {
        "BEV": 406,
        "PHEV": 42,
        "HEV": 735
      }
    }
  },
  {
    "periodo": "2015-08",
    "matriculaciones_mes": {
      "BEV": 113,
      "PHEV": 39,
      "HEV": 671
    },
    "bajas_mes": {
      "BEV": 27,
      "PHEV": 4,
      "HEV": 86
    },
    "parque_acumulado": {
      "BEV": 42272,
      "PHEV": 19369,
      "HEV": 207105,
      "REEV": 921,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 31882,
        "PHEV": 16506,
        "HEV": 197568
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 56
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2786,
        "HEV": 7557
      },
      "moto": {
        "BEV": 5609,
        "HEV": 44
      },
      "camion": {
        "BEV": 2815,
        "PHEV": 39,
        "HEV": 1075
      },
      "autobus": {
        "BEV": 345,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1091,
        "PHEV": 2,
        "HEV": 66
      },
      "otros": {
        "BEV": 413,
        "PHEV": 42,
        "HEV": 736
      }
    }
  },
  {
    "periodo": "2015-09",
    "matriculaciones_mes": {
      "BEV": 144,
      "PHEV": 118,
      "HEV": 798,
      "REEV": 1
    },
    "bajas_mes": {
      "BEV": 51,
      "PHEV": 36,
      "HEV": 113,
      "REEV": 2
    },
    "parque_acumulado": {
      "BEV": 42365,
      "PHEV": 19451,
      "HEV": 207790,
      "REEV": 920,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 31939,
        "PHEV": 16581,
        "HEV": 198251
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 56
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2792,
        "HEV": 7558
      },
      "moto": {
        "BEV": 5603,
        "HEV": 44
      },
      "camion": {
        "BEV": 2831,
        "PHEV": 39,
        "HEV": 1075
      },
      "autobus": {
        "BEV": 351,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1091,
        "PHEV": 2,
        "HEV": 67
      },
      "otros": {
        "BEV": 420,
        "PHEV": 42,
        "HEV": 736
      }
    }
  },
  {
    "periodo": "2015-10",
    "matriculaciones_mes": {
      "BEV": 389,
      "PHEV": 88,
      "HEV": 547
    },
    "bajas_mes": {
      "BEV": 51,
      "PHEV": 14,
      "HEV": 124
    },
    "parque_acumulado": {
      "BEV": 42703,
      "PHEV": 19525,
      "HEV": 208213,
      "REEV": 920,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 32226,
        "PHEV": 16648,
        "HEV": 198668
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 56
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2800,
        "HEV": 7562
      },
      "moto": {
        "BEV": 5597,
        "HEV": 44
      },
      "camion": {
        "BEV": 2854,
        "PHEV": 39,
        "HEV": 1075
      },
      "autobus": {
        "BEV": 362,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1091,
        "PHEV": 2,
        "HEV": 68
      },
      "otros": {
        "BEV": 421,
        "PHEV": 42,
        "HEV": 737
      }
    }
  },
  {
    "periodo": "2015-11",
    "matriculaciones_mes": {
      "BEV": 289,
      "PHEV": 59,
      "HEV": 96
    },
    "bajas_mes": {
      "BEV": 65,
      "PHEV": 25,
      "HEV": 116
    },
    "parque_acumulado": {
      "BEV": 42927,
      "PHEV": 19559,
      "HEV": 208193,
      "REEV": 920,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 32410,
        "PHEV": 16676,
        "HEV": 198646
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 56
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2806,
        "HEV": 7564
      },
      "moto": {
        "BEV": 5609,
        "HEV": 44
      },
      "camion": {
        "BEV": 2862,
        "PHEV": 39,
        "HEV": 1075
      },
      "autobus": {
        "BEV": 365,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1091,
        "PHEV": 2,
        "HEV": 68
      },
      "otros": {
        "BEV": 431,
        "PHEV": 42,
        "HEV": 737
      }
    }
  },
  {
    "periodo": "2015-12",
    "matriculaciones_mes": {
      "BEV": 164,
      "PHEV": 75,
      "HEV": 1455,
      "REEV": 5
    },
    "bajas_mes": {
      "BEV": 92,
      "PHEV": 43,
      "HEV": 162,
      "REEV": 2
    },
    "parque_acumulado": {
      "BEV": 42999,
      "PHEV": 19591,
      "HEV": 209486,
      "REEV": 923,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 32419,
        "PHEV": 16706,
        "HEV": 199915
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 71
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2809,
        "HEV": 7571
      },
      "moto": {
        "BEV": 5592,
        "HEV": 44
      },
      "camion": {
        "BEV": 2913,
        "PHEV": 39,
        "HEV": 1075
      },
      "autobus": {
        "BEV": 365,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1091,
        "PHEV": 2,
        "HEV": 69
      },
      "otros": {
        "BEV": 448,
        "PHEV": 42,
        "HEV": 737
      }
    }
  },
  {
    "periodo": "2016-01",
    "matriculaciones_mes": {
      "BEV": 205,
      "PHEV": 93,
      "HEV": 2125,
      "REEV": 14
    },
    "bajas_mes": {
      "BEV": 25,
      "PHEV": 23,
      "HEV": 140
    },
    "parque_acumulado": {
      "BEV": 43179,
      "PHEV": 19661,
      "HEV": 211471,
      "REEV": 937,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 32513,
        "PHEV": 16750,
        "HEV": 201894
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 71
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2835,
        "HEV": 7573
      },
      "moto": {
        "BEV": 5625,
        "HEV": 44
      },
      "camion": {
        "BEV": 2924,
        "PHEV": 39,
        "HEV": 1075
      },
      "autobus": {
        "BEV": 366,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1108,
        "PHEV": 2,
        "HEV": 73
      },
      "otros": {
        "BEV": 458,
        "PHEV": 42,
        "HEV": 737
      }
    }
  },
  {
    "periodo": "2016-02",
    "matriculaciones_mes": {
      "BEV": 184,
      "PHEV": 77,
      "HEV": 2050,
      "REEV": 12
    },
    "bajas_mes": {
      "BEV": 42,
      "PHEV": 9,
      "HEV": 94,
      "REEV": 2
    },
    "parque_acumulado": {
      "BEV": 43321,
      "PHEV": 19729,
      "HEV": 213427,
      "REEV": 947,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 32547,
        "PHEV": 16803,
        "HEV": 203842
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 71
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2852,
        "HEV": 7576
      },
      "moto": {
        "BEV": 5619,
        "HEV": 44
      },
      "camion": {
        "BEV": 2940,
        "PHEV": 39,
        "HEV": 1076
      },
      "autobus": {
        "BEV": 367,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1143,
        "PHEV": 2,
        "HEV": 76
      },
      "otros": {
        "BEV": 464,
        "PHEV": 42,
        "HEV": 738
      }
    }
  },
  {
    "periodo": "2016-03",
    "matriculaciones_mes": {
      "BEV": 456,
      "PHEV": 198,
      "HEV": 2108,
      "REEV": 18
    },
    "bajas_mes": {
      "BEV": 93,
      "PHEV": 13,
      "HEV": 139
    },
    "parque_acumulado": {
      "BEV": 43684,
      "PHEV": 19914,
      "HEV": 215396,
      "REEV": 965,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 32744,
        "PHEV": 16958,
        "HEV": 205803
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 71
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2882,
        "HEV": 7581
      },
      "moto": {
        "BEV": 5631,
        "HEV": 44
      },
      "camion": {
        "BEV": 2985,
        "PHEV": 39,
        "HEV": 1076
      },
      "autobus": {
        "BEV": 378,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1174,
        "PHEV": 2,
        "HEV": 79
      },
      "otros": {
        "BEV": 471,
        "PHEV": 42,
        "HEV": 738
      }
    }
  },
  {
    "periodo": "2016-04",
    "matriculaciones_mes": {
      "BEV": 331,
      "PHEV": 210,
      "HEV": 2062,
      "REEV": 6
    },
    "bajas_mes": {
      "BEV": 91,
      "PHEV": 10,
      "HEV": 141
    },
    "parque_acumulado": {
      "BEV": 43924,
      "PHEV": 20114,
      "HEV": 217317,
      "REEV": 971,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 32886,
        "PHEV": 17141,
        "HEV": 207721
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 71
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2901,
        "HEV": 7583
      },
      "moto": {
        "BEV": 5631,
        "HEV": 44
      },
      "camion": {
        "BEV": 3028,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 381,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1204,
        "PHEV": 2,
        "HEV": 79
      },
      "otros": {
        "BEV": 472,
        "PHEV": 42,
        "HEV": 738
      }
    }
  },
  {
    "periodo": "2016-05",
    "matriculaciones_mes": {
      "BEV": 422,
      "PHEV": 159,
      "HEV": 2638,
      "REEV": 32
    },
    "bajas_mes": {
      "BEV": 58,
      "PHEV": 10,
      "HEV": 141
    },
    "parque_acumulado": {
      "BEV": 44288,
      "PHEV": 20263,
      "HEV": 219814,
      "REEV": 1003,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 33029,
        "PHEV": 17239,
        "HEV": 210214
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 71
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 2953,
        "HEV": 7588
      },
      "moto": {
        "BEV": 5632,
        "HEV": 44
      },
      "camion": {
        "BEV": 3105,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 386,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1235,
        "PHEV": 2,
        "HEV": 78
      },
      "otros": {
        "BEV": 480,
        "PHEV": 42,
        "HEV": 738
      }
    }
  },
  {
    "periodo": "2016-06",
    "matriculaciones_mes": {
      "BEV": 254,
      "PHEV": 139,
      "HEV": 2685,
      "REEV": 18
    },
    "bajas_mes": {
      "BEV": 110,
      "PHEV": 17,
      "HEV": 156,
      "REEV": 1
    },
    "parque_acumulado": {
      "BEV": 44432,
      "PHEV": 20385,
      "HEV": 222343,
      "REEV": 1020,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 33084,
        "PHEV": 17300,
        "HEV": 212733
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 71
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3014,
        "HEV": 7594
      },
      "moto": {
        "BEV": 5609,
        "HEV": 45
      },
      "camion": {
        "BEV": 3153,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 391,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1269,
        "PHEV": 2,
        "HEV": 81
      },
      "otros": {
        "BEV": 495,
        "PHEV": 42,
        "HEV": 738
      }
    }
  },
  {
    "periodo": "2016-07",
    "matriculaciones_mes": {
      "BEV": 313,
      "PHEV": 111,
      "HEV": 2916,
      "REEV": 16
    },
    "bajas_mes": {
      "BEV": 40,
      "PHEV": 6,
      "HEV": 141,
      "REEV": 1
    },
    "parque_acumulado": {
      "BEV": 44705,
      "PHEV": 20490,
      "HEV": 225118,
      "REEV": 1035,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 33216,
        "PHEV": 17368,
        "HEV": 215498
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 71
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3051,
        "HEV": 7599
      },
      "moto": {
        "BEV": 5621,
        "HEV": 48
      },
      "camion": {
        "BEV": 3209,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 398,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1289,
        "PHEV": 2,
        "HEV": 82
      },
      "otros": {
        "BEV": 510,
        "PHEV": 42,
        "HEV": 739
      }
    }
  },
  {
    "periodo": "2016-08",
    "matriculaciones_mes": {
      "BEV": 148,
      "PHEV": 91,
      "HEV": 2322,
      "REEV": 6
    },
    "bajas_mes": {
      "BEV": 45,
      "PHEV": 11,
      "HEV": 142,
      "REEV": 1
    },
    "parque_acumulado": {
      "BEV": 44808,
      "PHEV": 20570,
      "HEV": 227298,
      "REEV": 1040,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 33277,
        "PHEV": 17429,
        "HEV": 217677
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 71
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3070,
        "HEV": 7601
      },
      "moto": {
        "BEV": 5612,
        "HEV": 47
      },
      "camion": {
        "BEV": 3238,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 398,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1304,
        "PHEV": 2,
        "HEV": 82
      },
      "otros": {
        "BEV": 518,
        "PHEV": 42,
        "HEV": 739
      }
    }
  },
  {
    "periodo": "2016-09",
    "matriculaciones_mes": {
      "BEV": 291,
      "PHEV": 145,
      "HEV": 2421,
      "REEV": 6
    },
    "bajas_mes": {
      "BEV": 21,
      "PHEV": 15,
      "HEV": 197
    },
    "parque_acumulado": {
      "BEV": 45078,
      "PHEV": 20700,
      "HEV": 229522,
      "REEV": 1046,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 33382,
        "PHEV": 17529,
        "HEV": 219894
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 71
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3099,
        "HEV": 7605
      },
      "moto": {
        "BEV": 5639,
        "HEV": 48
      },
      "camion": {
        "BEV": 3290,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 398,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1341,
        "PHEV": 3,
        "HEV": 83
      },
      "otros": {
        "BEV": 533,
        "PHEV": 42,
        "HEV": 740
      }
    }
  },
  {
    "periodo": "2016-10",
    "matriculaciones_mes": {
      "BEV": 323,
      "PHEV": 93,
      "HEV": 2754,
      "REEV": 8
    },
    "bajas_mes": {
      "BEV": 76,
      "PHEV": 13,
      "HEV": 177,
      "REEV": 1
    },
    "parque_acumulado": {
      "BEV": 45325,
      "PHEV": 20780,
      "HEV": 232099,
      "REEV": 1053,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 33462,
        "PHEV": 17596,
        "HEV": 222467
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 71
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3113,
        "HEV": 7608
      },
      "moto": {
        "BEV": 5629,
        "HEV": 48
      },
      "camion": {
        "BEV": 3386,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 399,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1385,
        "PHEV": 3,
        "HEV": 83
      },
      "otros": {
        "BEV": 540,
        "PHEV": 42,
        "HEV": 740
      }
    }
  },
  {
    "periodo": "2016-11",
    "matriculaciones_mes": {
      "BEV": 541,
      "PHEV": 115,
      "HEV": 3176,
      "REEV": 8
    },
    "bajas_mes": {
      "BEV": 81,
      "PHEV": 6,
      "HEV": 209,
      "REEV": 10
    },
    "parque_acumulado": {
      "BEV": 45785,
      "PHEV": 20889,
      "HEV": 235066,
      "REEV": 1051,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 33827,
        "PHEV": 17669,
        "HEV": 225432
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 71
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3150,
        "HEV": 7610
      },
      "moto": {
        "BEV": 5632,
        "HEV": 46
      },
      "camion": {
        "BEV": 3416,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 403,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1416,
        "PHEV": 3,
        "HEV": 85
      },
      "otros": {
        "BEV": 540,
        "PHEV": 42,
        "HEV": 741
      }
    }
  },
  {
    "periodo": "2016-12",
    "matriculaciones_mes": {
      "BEV": 573,
      "PHEV": 91,
      "HEV": 3165,
      "REEV": 11
    },
    "bajas_mes": {
      "BEV": 68,
      "PHEV": 11,
      "HEV": 262,
      "REEV": 1
    },
    "parque_acumulado": {
      "BEV": 46290,
      "PHEV": 20969,
      "HEV": 237969,
      "REEV": 1061,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 34156,
        "PHEV": 17716,
        "HEV": 228291
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 104
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3184,
        "HEV": 7618
      },
      "moto": {
        "BEV": 5659,
        "HEV": 46
      },
      "camion": {
        "BEV": 3472,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 403,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1471,
        "PHEV": 3,
        "HEV": 87
      },
      "otros": {
        "BEV": 544,
        "PHEV": 42,
        "HEV": 742
      }
    }
  },
  {
    "periodo": "2017-01",
    "matriculaciones_mes": {
      "BEV": 287,
      "PHEV": 122,
      "HEV": 4286,
      "REEV": 13
    },
    "bajas_mes": {
      "BEV": 55,
      "PHEV": 5,
      "HEV": 188
    },
    "parque_acumulado": {
      "BEV": 46522,
      "PHEV": 21086,
      "HEV": 242067,
      "REEV": 1074,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 34234,
        "PHEV": 17809,
        "HEV": 232374
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 111
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3208,
        "HEV": 7622
      },
      "moto": {
        "BEV": 5675,
        "HEV": 47
      },
      "camion": {
        "BEV": 3500,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 404,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1512,
        "PHEV": 3,
        "HEV": 90
      },
      "otros": {
        "BEV": 541,
        "PHEV": 42,
        "HEV": 742
      }
    }
  },
  {
    "periodo": "2017-02",
    "matriculaciones_mes": {
      "BEV": 365,
      "PHEV": 99,
      "HEV": 3961,
      "REEV": 17
    },
    "bajas_mes": {
      "BEV": 64,
      "PHEV": 5,
      "HEV": 204,
      "REEV": 1
    },
    "parque_acumulado": {
      "BEV": 46823,
      "PHEV": 21180,
      "HEV": 245824,
      "REEV": 1090,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 34411,
        "PHEV": 17885,
        "HEV": 236119
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 111
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3227,
        "HEV": 7626
      },
      "moto": {
        "BEV": 5696,
        "HEV": 51
      },
      "camion": {
        "BEV": 3531,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 404,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1556,
        "PHEV": 3,
        "HEV": 91
      },
      "otros": {
        "BEV": 546,
        "PHEV": 42,
        "HEV": 745
      }
    }
  },
  {
    "periodo": "2017-03",
    "matriculaciones_mes": {
      "BEV": 499,
      "PHEV": 158,
      "HEV": 4518,
      "REEV": 36
    },
    "bajas_mes": {
      "BEV": 119,
      "PHEV": 6,
      "HEV": 241,
      "REEV": 2
    },
    "parque_acumulado": {
      "BEV": 47203,
      "PHEV": 21332,
      "HEV": 250101,
      "REEV": 1124,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 34688,
        "PHEV": 18010,
        "HEV": 240389
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 111
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3255,
        "HEV": 7630
      },
      "moto": {
        "BEV": 5682,
        "HEV": 51
      },
      "camion": {
        "BEV": 3598,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 411,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1595,
        "PHEV": 3,
        "HEV": 94
      },
      "otros": {
        "BEV": 546,
        "PHEV": 42,
        "HEV": 745
      }
    }
  },
  {
    "periodo": "2017-04",
    "matriculaciones_mes": {
      "BEV": 604,
      "PHEV": 153,
      "HEV": 3681,
      "REEV": 37
    },
    "bajas_mes": {
      "BEV": 60,
      "PHEV": 7,
      "HEV": 226,
      "REEV": 3
    },
    "parque_acumulado": {
      "BEV": 47747,
      "PHEV": 21478,
      "HEV": 253556,
      "REEV": 1158,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 34835,
        "PHEV": 18134,
        "HEV": 243834
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 111
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3277,
        "HEV": 7635
      },
      "moto": {
        "BEV": 5979,
        "HEV": 54
      },
      "camion": {
        "BEV": 3620,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 413,
        "PHEV": 0,
        "HEV": 3
      },
      "especial": {
        "BEV": 1621,
        "PHEV": 3,
        "HEV": 96
      },
      "otros": {
        "BEV": 547,
        "PHEV": 42,
        "HEV": 745
      }
    }
  },
  {
    "periodo": "2017-05",
    "matriculaciones_mes": {
      "BEV": 517,
      "PHEV": 241,
      "HEV": 4992,
      "REEV": 35
    },
    "bajas_mes": {
      "BEV": 86,
      "PHEV": 15,
      "HEV": 285,
      "REEV": 3
    },
    "parque_acumulado": {
      "BEV": 48178,
      "PHEV": 21704,
      "HEV": 258263,
      "REEV": 1190,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 35014,
        "PHEV": 18324,
        "HEV": 248527
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 111
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3311,
        "HEV": 7637
      },
      "moto": {
        "BEV": 6124,
        "HEV": 56
      },
      "camion": {
        "BEV": 3678,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 435,
        "PHEV": 2,
        "HEV": 3
      },
      "especial": {
        "BEV": 1662,
        "PHEV": 3,
        "HEV": 101
      },
      "otros": {
        "BEV": 542,
        "PHEV": 42,
        "HEV": 750
      }
    }
  },
  {
    "periodo": "2017-06",
    "matriculaciones_mes": {
      "BEV": 556,
      "PHEV": 348,
      "HEV": 5604,
      "REEV": 38
    },
    "bajas_mes": {
      "BEV": 54,
      "PHEV": 14,
      "HEV": 241
    },
    "parque_acumulado": {
      "BEV": 48680,
      "PHEV": 22038,
      "HEV": 263626,
      "REEV": 1228,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 35329,
        "PHEV": 18623,
        "HEV": 253876
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 111
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3348,
        "HEV": 7646
      },
      "moto": {
        "BEV": 6194,
        "HEV": 56
      },
      "camion": {
        "BEV": 3716,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 443,
        "PHEV": 2,
        "HEV": 3
      },
      "especial": {
        "BEV": 1694,
        "PHEV": 3,
        "HEV": 105
      },
      "otros": {
        "BEV": 552,
        "PHEV": 42,
        "HEV": 751
      }
    }
  },
  {
    "periodo": "2017-07",
    "matriculaciones_mes": {
      "BEV": 793,
      "PHEV": 333,
      "HEV": 5115,
      "REEV": 40
    },
    "bajas_mes": {
      "BEV": 58,
      "PHEV": 11,
      "HEV": 262,
      "REEV": 1
    },
    "parque_acumulado": {
      "BEV": 49415,
      "PHEV": 22360,
      "HEV": 268479,
      "REEV": 1267,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 35571,
        "PHEV": 18900,
        "HEV": 258721
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 111
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3394,
        "HEV": 7651
      },
      "moto": {
        "BEV": 6566,
        "HEV": 55
      },
      "camion": {
        "BEV": 3743,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 445,
        "PHEV": 2,
        "HEV": 3
      },
      "especial": {
        "BEV": 1735,
        "PHEV": 3,
        "HEV": 109
      },
      "otros": {
        "BEV": 554,
        "PHEV": 42,
        "HEV": 751
      }
    }
  },
  {
    "periodo": "2017-08",
    "matriculaciones_mes": {
      "BEV": 733,
      "PHEV": 336,
      "HEV": 4395,
      "REEV": 11
    },
    "bajas_mes": {
      "BEV": 41,
      "PHEV": 17,
      "HEV": 265,
      "REEV": 1
    },
    "parque_acumulado": {
      "BEV": 50107,
      "PHEV": 22679,
      "HEV": 272609,
      "REEV": 1277,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 35876,
        "PHEV": 19204,
        "HEV": 262842
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 111
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3409,
        "HEV": 7655
      },
      "moto": {
        "BEV": 6712,
        "HEV": 56
      },
      "camion": {
        "BEV": 3781,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 451,
        "PHEV": 2,
        "HEV": 3
      },
      "especial": {
        "BEV": 1758,
        "PHEV": 3,
        "HEV": 111
      },
      "otros": {
        "BEV": 574,
        "PHEV": 42,
        "HEV": 753
      }
    }
  },
  {
    "periodo": "2017-09",
    "matriculaciones_mes": {
      "BEV": 1015,
      "PHEV": 308,
      "HEV": 4223,
      "REEV": 26
    },
    "bajas_mes": {
      "BEV": 52,
      "PHEV": 9,
      "HEV": 283,
      "REEV": 4
    },
    "parque_acumulado": {
      "BEV": 51070,
      "PHEV": 22978,
      "HEV": 276549,
      "REEV": 1299,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 36408,
        "PHEV": 19469,
        "HEV": 266771
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 111
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3442,
        "HEV": 7663
      },
      "moto": {
        "BEV": 6934,
        "HEV": 57
      },
      "camion": {
        "BEV": 3826,
        "PHEV": 39,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 477,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 1791,
        "PHEV": 4,
        "HEV": 112
      },
      "otros": {
        "BEV": 574,
        "PHEV": 42,
        "HEV": 753
      }
    }
  },
  {
    "periodo": "2017-10",
    "matriculaciones_mes": {
      "BEV": 1567,
      "PHEV": 330,
      "HEV": 4943,
      "REEV": 17
    },
    "bajas_mes": {
      "BEV": 94,
      "PHEV": 7,
      "HEV": 314,
      "REEV": 2
    },
    "parque_acumulado": {
      "BEV": 52543,
      "PHEV": 23301,
      "HEV": 281178,
      "REEV": 1314,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 37228,
        "PHEV": 19771,
        "HEV": 271384
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 111
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3462,
        "HEV": 7668
      },
      "moto": {
        "BEV": 7285,
        "HEV": 61
      },
      "camion": {
        "BEV": 3964,
        "PHEV": 40,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 490,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 1830,
        "PHEV": 4,
        "HEV": 118
      },
      "otros": {
        "BEV": 585,
        "PHEV": 42,
        "HEV": 754
      }
    }
  },
  {
    "periodo": "2017-11",
    "matriculaciones_mes": {
      "BEV": 1042,
      "PHEV": 374,
      "HEV": 5524,
      "REEV": 27
    },
    "bajas_mes": {
      "BEV": 77,
      "PHEV": 17,
      "HEV": 332,
      "REEV": 2
    },
    "parque_acumulado": {
      "BEV": 53508,
      "PHEV": 23658,
      "HEV": 286370,
      "REEV": 1339,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 37480,
        "PHEV": 20095,
        "HEV": 276562
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 111
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3495,
        "HEV": 7672
      },
      "moto": {
        "BEV": 7715,
        "HEV": 66
      },
      "camion": {
        "BEV": 3997,
        "PHEV": 40,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 490,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 1892,
        "PHEV": 4,
        "HEV": 121
      },
      "otros": {
        "BEV": 598,
        "PHEV": 42,
        "HEV": 756
      }
    }
  },
  {
    "periodo": "2017-12",
    "matriculaciones_mes": {
      "BEV": 1022,
      "PHEV": 548,
      "HEV": 4677,
      "REEV": 46
    },
    "bajas_mes": {
      "BEV": 161,
      "PHEV": 23,
      "HEV": 435,
      "REEV": 2
    },
    "parque_acumulado": {
      "BEV": 54369,
      "PHEV": 24183,
      "HEV": 290612,
      "REEV": 1383,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 37892,
        "PHEV": 20539,
        "HEV": 280763
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 144
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3578,
        "HEV": 7676
      },
      "moto": {
        "BEV": 7822,
        "HEV": 66
      },
      "camion": {
        "BEV": 4053,
        "PHEV": 40,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 494,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 1942,
        "PHEV": 4,
        "HEV": 125
      },
      "otros": {
        "BEV": 594,
        "PHEV": 42,
        "HEV": 756
      }
    }
  },
  {
    "periodo": "2018-01",
    "matriculaciones_mes": {
      "BEV": 1276,
      "PHEV": 374,
      "HEV": 5989,
      "REEV": 21
    },
    "bajas_mes": {
      "BEV": 71,
      "PHEV": 15,
      "HEV": 257,
      "REEV": 3
    },
    "parque_acumulado": {
      "BEV": 55574,
      "PHEV": 24542,
      "HEV": 296344,
      "REEV": 1401,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 38242,
        "PHEV": 20866,
        "HEV": 286466
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 155
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3610,
        "HEV": 7682
      },
      "moto": {
        "BEV": 8421,
        "HEV": 74
      },
      "camion": {
        "BEV": 4144,
        "PHEV": 40,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 519,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 1973,
        "PHEV": 4,
        "HEV": 129
      },
      "otros": {
        "BEV": 600,
        "PHEV": 42,
        "HEV": 756
      }
    }
  },
  {
    "periodo": "2018-02",
    "matriculaciones_mes": {
      "BEV": 770,
      "PHEV": 350,
      "HEV": 5352,
      "REEV": 27
    },
    "bajas_mes": {
      "BEV": 123,
      "PHEV": 9,
      "HEV": 334,
      "REEV": 9
    },
    "parque_acumulado": {
      "BEV": 56221,
      "PHEV": 24883,
      "HEV": 301362,
      "REEV": 1419,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 38595,
        "PHEV": 21172,
        "HEV": 291468
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 155
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3645,
        "HEV": 7685
      },
      "moto": {
        "BEV": 8571,
        "HEV": 82
      },
      "camion": {
        "BEV": 4188,
        "PHEV": 40,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 530,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 2002,
        "PHEV": 4,
        "HEV": 134
      },
      "otros": {
        "BEV": 626,
        "PHEV": 42,
        "HEV": 756
      }
    }
  },
  {
    "periodo": "2018-03",
    "matriculaciones_mes": {
      "BEV": 1562,
      "PHEV": 317,
      "HEV": 5428,
      "REEV": 25
    },
    "bajas_mes": {
      "BEV": 113,
      "PHEV": 17,
      "HEV": 307,
      "REEV": 13
    },
    "parque_acumulado": {
      "BEV": 57670,
      "PHEV": 25183,
      "HEV": 306483,
      "REEV": 1431,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 39021,
        "PHEV": 21439,
        "HEV": 296572
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 165
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3679,
        "HEV": 7687
      },
      "moto": {
        "BEV": 8725,
        "HEV": 82
      },
      "camion": {
        "BEV": 4275,
        "PHEV": 40,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 546,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 2050,
        "PHEV": 4,
        "HEV": 137
      },
      "otros": {
        "BEV": 625,
        "PHEV": 42,
        "HEV": 758
      }
    }
  },
  {
    "periodo": "2018-04",
    "matriculaciones_mes": {
      "BEV": 1043,
      "PHEV": 274,
      "HEV": 6088,
      "REEV": 26
    },
    "bajas_mes": {
      "BEV": 93,
      "PHEV": 16,
      "HEV": 350,
      "REEV": 3
    },
    "parque_acumulado": {
      "BEV": 58620,
      "PHEV": 25441,
      "HEV": 312221,
      "REEV": 1454,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 39447,
        "PHEV": 21666,
        "HEV": 302294
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 165
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3710,
        "HEV": 7693
      },
      "moto": {
        "BEV": 8978,
        "HEV": 85
      },
      "camion": {
        "BEV": 4365,
        "PHEV": 40,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 556,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 2123,
        "PHEV": 4,
        "HEV": 143
      },
      "otros": {
        "BEV": 632,
        "PHEV": 42,
        "HEV": 759
      }
    }
  },
  {
    "periodo": "2018-05",
    "matriculaciones_mes": {
      "BEV": 989,
      "PHEV": 472,
      "HEV": 6995,
      "REEV": 28
    },
    "bajas_mes": {
      "BEV": 117,
      "PHEV": 29,
      "HEV": 342,
      "REEV": 9
    },
    "parque_acumulado": {
      "BEV": 59492,
      "PHEV": 25884,
      "HEV": 318874,
      "REEV": 1473,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 39733,
        "PHEV": 22058,
        "HEV": 308913
      },
      "suv_todo_terreno": {
        "BEV": 11,
        "HEV": 175
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3761,
        "HEV": 7694
      },
      "moto": {
        "BEV": 9074,
        "HEV": 98
      },
      "camion": {
        "BEV": 4405,
        "PHEV": 40,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 558,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 2196,
        "PHEV": 4,
        "HEV": 150
      },
      "otros": {
        "BEV": 634,
        "PHEV": 42,
        "HEV": 762
      }
    }
  },
  {
    "periodo": "2018-06",
    "matriculaciones_mes": {
      "BEV": 1319,
      "PHEV": 925,
      "HEV": 8087,
      "REEV": 48
    },
    "bajas_mes": {
      "BEV": 131,
      "PHEV": 26,
      "HEV": 338,
      "REEV": 5
    },
    "parque_acumulado": {
      "BEV": 60680,
      "PHEV": 26783,
      "HEV": 326623,
      "REEV": 1516,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 40062,
        "PHEV": 22897,
        "HEV": 316635
      },
      "suv_todo_terreno": {
        "BEV": 11,
        "HEV": 175
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3819,
        "HEV": 7699
      },
      "moto": {
        "BEV": 9234,
        "HEV": 113
      },
      "camion": {
        "BEV": 4469,
        "PHEV": 40,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 574,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 2239,
        "PHEV": 5,
        "HEV": 153
      },
      "otros": {
        "BEV": 646,
        "PHEV": 43,
        "HEV": 766
      }
    }
  },
  {
    "periodo": "2018-07",
    "matriculaciones_mes": {
      "BEV": 1009,
      "PHEV": 482,
      "HEV": 7532,
      "REEV": 27
    },
    "bajas_mes": {
      "BEV": 248,
      "PHEV": 22,
      "HEV": 349,
      "REEV": 5
    },
    "parque_acumulado": {
      "BEV": 61441,
      "PHEV": 27243,
      "HEV": 333806,
      "REEV": 1538,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 40406,
        "PHEV": 23261,
        "HEV": 323813
      },
      "suv_todo_terreno": {
        "BEV": 15,
        "HEV": 175
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 3916,
        "HEV": 7700
      },
      "moto": {
        "BEV": 9291,
        "HEV": 114
      },
      "camion": {
        "BEV": 4495,
        "PHEV": 40,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 607,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 2296,
        "PHEV": 5,
        "HEV": 155
      },
      "otros": {
        "BEV": 657,
        "PHEV": 43,
        "HEV": 767
      }
    }
  },
  {
    "periodo": "2018-08",
    "matriculaciones_mes": {
      "BEV": 687,
      "PHEV": 423,
      "HEV": 6154,
      "REEV": 39
    },
    "bajas_mes": {
      "BEV": 80,
      "PHEV": 19,
      "HEV": 338,
      "REEV": 9
    },
    "parque_acumulado": {
      "BEV": 62048,
      "PHEV": 27647,
      "HEV": 339622,
      "REEV": 1568,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 40685,
        "PHEV": 23524,
        "HEV": 329605
      },
      "suv_todo_terreno": {
        "BEV": 18,
        "HEV": 175
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 4056,
        "HEV": 7715
      },
      "moto": {
        "BEV": 9429,
        "HEV": 116
      },
      "camion": {
        "BEV": 4549,
        "PHEV": 40,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 617,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 2336,
        "PHEV": 5,
        "HEV": 159
      },
      "otros": {
        "BEV": 658,
        "PHEV": 43,
        "HEV": 770
      }
    }
  },
  {
    "periodo": "2018-09",
    "matriculaciones_mes": {
      "BEV": 1654,
      "PHEV": 386,
      "HEV": 5496,
      "REEV": 31,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 93,
      "PHEV": 23,
      "HEV": 343,
      "REEV": 6
    },
    "parque_acumulado": {
      "BEV": 63609,
      "PHEV": 28010,
      "HEV": 344775,
      "REEV": 1593,
      "FCEV": 4
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 41157,
        "PHEV": 23812,
        "HEV": 334706
      },
      "suv_todo_terreno": {
        "BEV": 18,
        "HEV": 175
      },
      "furgoneta_van": {
        "BEV": 9,
        "PHEV": 4129,
        "HEV": 7750
      },
      "moto": {
        "BEV": 10106,
        "HEV": 127
      },
      "camion": {
        "BEV": 4622,
        "PHEV": 40,
        "HEV": 1077
      },
      "autobus": {
        "BEV": 638,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 2395,
        "PHEV": 5,
        "HEV": 165
      },
      "otros": {
        "BEV": 672,
        "PHEV": 43,
        "HEV": 770
      }
    }
  },
  {
    "periodo": "2018-10",
    "matriculaciones_mes": {
      "BEV": 1471,
      "PHEV": 444,
      "HEV": 6847,
      "REEV": 51
    },
    "bajas_mes": {
      "BEV": 125,
      "PHEV": 44,
      "HEV": 513,
      "REEV": 18
    },
    "parque_acumulado": {
      "BEV": 64955,
      "PHEV": 28410,
      "HEV": 351109,
      "REEV": 1626,
      "FCEV": 4
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 41718,
        "PHEV": 24134,
        "HEV": 340978
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 175
      },
      "furgoneta_van": {
        "BEV": 9,
        "PHEV": 4207,
        "HEV": 7799
      },
      "moto": {
        "BEV": 10384,
        "HEV": 135
      },
      "camion": {
        "BEV": 4711,
        "PHEV": 40,
        "HEV": 1078
      },
      "autobus": {
        "BEV": 668,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 2470,
        "PHEV": 5,
        "HEV": 169
      },
      "otros": {
        "BEV": 710,
        "PHEV": 43,
        "HEV": 771
      }
    }
  },
  {
    "periodo": "2018-11",
    "matriculaciones_mes": {
      "BEV": 1522,
      "PHEV": 514,
      "HEV": 6331,
      "REEV": 37
    },
    "bajas_mes": {
      "BEV": 136,
      "PHEV": 27,
      "HEV": 617,
      "REEV": 8
    },
    "parque_acumulado": {
      "BEV": 66341,
      "PHEV": 28897,
      "HEV": 356823,
      "REEV": 1655,
      "FCEV": 4
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 42382,
        "PHEV": 24503,
        "HEV": 346658
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 175
      },
      "furgoneta_van": {
        "BEV": 9,
        "PHEV": 4323,
        "HEV": 7824
      },
      "moto": {
        "BEV": 10591,
        "HEV": 137
      },
      "camion": {
        "BEV": 4797,
        "PHEV": 40,
        "HEV": 1078
      },
      "autobus": {
        "BEV": 681,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 2529,
        "PHEV": 7,
        "HEV": 173
      },
      "otros": {
        "BEV": 749,
        "PHEV": 43,
        "HEV": 774
      }
    }
  },
  {
    "periodo": "2018-12",
    "matriculaciones_mes": {
      "BEV": 2332,
      "PHEV": 862,
      "HEV": 6079,
      "REEV": 27
    },
    "bajas_mes": {
      "BEV": 166,
      "PHEV": 30,
      "HEV": 622,
      "REEV": 11
    },
    "parque_acumulado": {
      "BEV": 68507,
      "PHEV": 29729,
      "HEV": 362280,
      "REEV": 1671,
      "FCEV": 4
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 43760,
        "PHEV": 25212,
        "HEV": 352066
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 175
      },
      "furgoneta_van": {
        "BEV": 9,
        "PHEV": 4446,
        "HEV": 7868
      },
      "moto": {
        "BEV": 10653,
        "HEV": 136
      },
      "camion": {
        "BEV": 5023,
        "PHEV": 40,
        "HEV": 1078
      },
      "autobus": {
        "BEV": 696,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 2578,
        "PHEV": 7,
        "HEV": 178
      },
      "otros": {
        "BEV": 771,
        "PHEV": 43,
        "HEV": 776
      }
    }
  },
  {
    "periodo": "2019-01",
    "matriculaciones_mes": {
      "BEV": 1419,
      "PHEV": 545,
      "HEV": 7705,
      "REEV": 31
    },
    "bajas_mes": {
      "BEV": 131,
      "PHEV": 25,
      "HEV": 413,
      "REEV": 19
    },
    "parque_acumulado": {
      "BEV": 69795,
      "PHEV": 30249,
      "HEV": 369572,
      "REEV": 1683,
      "FCEV": 4
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 44381,
        "PHEV": 25580,
        "HEV": 359239
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 175
      },
      "furgoneta_van": {
        "BEV": 9,
        "PHEV": 4598,
        "HEV": 7976
      },
      "moto": {
        "BEV": 10699,
        "HEV": 142
      },
      "camion": {
        "BEV": 5105,
        "PHEV": 40,
        "HEV": 1078
      },
      "autobus": {
        "BEV": 714,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 2671,
        "PHEV": 7,
        "HEV": 182
      },
      "otros": {
        "BEV": 778,
        "PHEV": 43,
        "HEV": 776
      }
    }
  },
  {
    "periodo": "2019-02",
    "matriculaciones_mes": {
      "BEV": 1689,
      "PHEV": 491,
      "HEV": 7090,
      "REEV": 36
    },
    "bajas_mes": {
      "BEV": 90,
      "PHEV": 19,
      "HEV": 393,
      "REEV": 14
    },
    "parque_acumulado": {
      "BEV": 71394,
      "PHEV": 30721,
      "HEV": 376269,
      "REEV": 1705,
      "FCEV": 4
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 45251,
        "PHEV": 25916,
        "HEV": 365824
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 193
      },
      "furgoneta_van": {
        "BEV": 9,
        "PHEV": 4733,
        "HEV": 8061
      },
      "moto": {
        "BEV": 10814,
        "HEV": 150
      },
      "camion": {
        "BEV": 5192,
        "PHEV": 41,
        "HEV": 1078
      },
      "autobus": {
        "BEV": 721,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 2732,
        "PHEV": 7,
        "HEV": 182
      },
      "otros": {
        "BEV": 792,
        "PHEV": 43,
        "HEV": 777
      }
    }
  },
  {
    "periodo": "2019-03",
    "matriculaciones_mes": {
      "BEV": 2044,
      "PHEV": 837,
      "HEV": 7991,
      "REEV": 27
    },
    "bajas_mes": {
      "BEV": 142,
      "PHEV": 38,
      "HEV": 486,
      "REEV": 6
    },
    "parque_acumulado": {
      "BEV": 73296,
      "PHEV": 31520,
      "HEV": 383774,
      "REEV": 1726,
      "FCEV": 4
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 46549,
        "PHEV": 26565,
        "HEV": 373178
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 194
      },
      "furgoneta_van": {
        "BEV": 10,
        "PHEV": 4883,
        "HEV": 8205
      },
      "moto": {
        "BEV": 11032,
        "HEV": 151
      },
      "camion": {
        "BEV": 5296,
        "PHEV": 41,
        "HEV": 1078
      },
      "autobus": {
        "BEV": 726,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 2796,
        "PHEV": 7,
        "HEV": 184
      },
      "otros": {
        "BEV": 813,
        "PHEV": 44,
        "HEV": 780
      }
    }
  },
  {
    "periodo": "2019-04",
    "matriculaciones_mes": {
      "BEV": 1244,
      "PHEV": 705,
      "HEV": 7960,
      "REEV": 26
    },
    "bajas_mes": {
      "BEV": 130,
      "PHEV": 27,
      "HEV": 458,
      "REEV": 6
    },
    "parque_acumulado": {
      "BEV": 74410,
      "PHEV": 32198,
      "HEV": 391276,
      "REEV": 1746,
      "FCEV": 4
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 47194,
        "PHEV": 27126,
        "HEV": 380446
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 200
      },
      "furgoneta_van": {
        "BEV": 10,
        "PHEV": 5000,
        "HEV": 8417
      },
      "moto": {
        "BEV": 11071,
        "HEV": 158
      },
      "camion": {
        "BEV": 5368,
        "PHEV": 41,
        "HEV": 1080
      },
      "autobus": {
        "BEV": 735,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 2851,
        "PHEV": 7,
        "HEV": 189
      },
      "otros": {
        "BEV": 823,
        "PHEV": 44,
        "HEV": 782
      }
    }
  },
  {
    "periodo": "2019-05",
    "matriculaciones_mes": {
      "BEV": 1941,
      "PHEV": 710,
      "HEV": 10661,
      "REEV": 30
    },
    "bajas_mes": {
      "BEV": 119,
      "PHEV": 39,
      "HEV": 486,
      "REEV": 12,
      "FCEV": 1
    },
    "parque_acumulado": {
      "BEV": 76232,
      "PHEV": 32869,
      "HEV": 401451,
      "REEV": 1764,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 48184,
        "PHEV": 27721,
        "HEV": 390288
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 232
      },
      "furgoneta_van": {
        "BEV": 10,
        "PHEV": 5076,
        "HEV": 8695
      },
      "moto": {
        "BEV": 11508,
        "HEV": 167
      },
      "camion": {
        "BEV": 5491,
        "PHEV": 41,
        "HEV": 1083
      },
      "autobus": {
        "BEV": 738,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 2920,
        "PHEV": 7,
        "HEV": 196
      },
      "otros": {
        "BEV": 835,
        "PHEV": 44,
        "HEV": 786
      }
    }
  },
  {
    "periodo": "2019-06",
    "matriculaciones_mes": {
      "BEV": 2784,
      "PHEV": 494,
      "HEV": 9589,
      "REEV": 19
    },
    "bajas_mes": {
      "BEV": 137,
      "PHEV": 35,
      "HEV": 541,
      "REEV": 7
    },
    "parque_acumulado": {
      "BEV": 78879,
      "PHEV": 33328,
      "HEV": 410499,
      "REEV": 1776,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 49328,
        "PHEV": 28112,
        "HEV": 398996
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 232
      },
      "furgoneta_van": {
        "BEV": 10,
        "PHEV": 5143,
        "HEV": 8993
      },
      "moto": {
        "BEV": 12597,
        "HEV": 198
      },
      "camion": {
        "BEV": 5619,
        "PHEV": 41,
        "HEV": 1091
      },
      "autobus": {
        "BEV": 761,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 3000,
        "PHEV": 8,
        "HEV": 198
      },
      "otros": {
        "BEV": 871,
        "PHEV": 44,
        "HEV": 787
      }
    }
  },
  {
    "periodo": "2019-07",
    "matriculaciones_mes": {
      "BEV": 2701,
      "PHEV": 538,
      "HEV": 10145,
      "REEV": 31
    },
    "bajas_mes": {
      "BEV": 181,
      "PHEV": 53,
      "HEV": 626,
      "REEV": 7
    },
    "parque_acumulado": {
      "BEV": 81399,
      "PHEV": 33813,
      "HEV": 420018,
      "REEV": 1800,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 50002,
        "PHEV": 28508,
        "HEV": 408093
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 250
      },
      "furgoneta_van": {
        "BEV": 10,
        "PHEV": 5231,
        "HEV": 9384
      },
      "moto": {
        "BEV": 13533,
        "HEV": 199
      },
      "camion": {
        "BEV": 5696,
        "PHEV": 41,
        "HEV": 1097
      },
      "autobus": {
        "BEV": 771,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 3067,
        "PHEV": 9,
        "HEV": 200
      },
      "otros": {
        "BEV": 896,
        "PHEV": 44,
        "HEV": 791
      }
    }
  },
  {
    "periodo": "2019-08",
    "matriculaciones_mes": {
      "BEV": 846,
      "PHEV": 475,
      "HEV": 7040,
      "REEV": 15
    },
    "bajas_mes": {
      "BEV": 272,
      "PHEV": 35,
      "HEV": 549,
      "REEV": 6
    },
    "parque_acumulado": {
      "BEV": 81973,
      "PHEV": 34253,
      "HEV": 426509,
      "REEV": 1809,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 50464,
        "PHEV": 28853,
        "HEV": 414333
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 251
      },
      "furgoneta_van": {
        "BEV": 10,
        "PHEV": 5325,
        "HEV": 9595
      },
      "moto": {
        "BEV": 13387,
        "HEV": 203
      },
      "camion": {
        "BEV": 5796,
        "PHEV": 41,
        "HEV": 1100
      },
      "autobus": {
        "BEV": 778,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 3082,
        "PHEV": 10,
        "HEV": 201
      },
      "otros": {
        "BEV": 917,
        "PHEV": 44,
        "HEV": 822
      }
    }
  },
  {
    "periodo": "2019-09",
    "matriculaciones_mes": {
      "BEV": 1871,
      "PHEV": 572,
      "HEV": 8526,
      "REEV": 20
    },
    "bajas_mes": {
      "BEV": 151,
      "PHEV": 62,
      "HEV": 734,
      "REEV": 6
    },
    "parque_acumulado": {
      "BEV": 83693,
      "PHEV": 34763,
      "HEV": 434301,
      "REEV": 1823,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 51171,
        "PHEV": 29185,
        "HEV": 421630
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 251
      },
      "furgoneta_van": {
        "BEV": 10,
        "PHEV": 5502,
        "HEV": 10023
      },
      "moto": {
        "BEV": 13452,
        "HEV": 205
      },
      "camion": {
        "BEV": 5881,
        "PHEV": 42,
        "HEV": 1131
      },
      "autobus": {
        "BEV": 792,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 3161,
        "PHEV": 10,
        "HEV": 205
      },
      "otros": {
        "BEV": 941,
        "PHEV": 44,
        "HEV": 852
      }
    }
  },
  {
    "periodo": "2019-10",
    "matriculaciones_mes": {
      "BEV": 1907,
      "PHEV": 828,
      "HEV": 10389,
      "REEV": 29
    },
    "bajas_mes": {
      "BEV": 207,
      "PHEV": 57,
      "HEV": 1002,
      "REEV": 9
    },
    "parque_acumulado": {
      "BEV": 85393,
      "PHEV": 35534,
      "HEV": 443688,
      "REEV": 1843,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 51927,
        "PHEV": 29668,
        "HEV": 430292
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 251
      },
      "furgoneta_van": {
        "BEV": 10,
        "PHEV": 5790,
        "HEV": 10653
      },
      "moto": {
        "BEV": 13977,
        "HEV": 206
      },
      "camion": {
        "BEV": 5999,
        "PHEV": 42,
        "HEV": 1177
      },
      "autobus": {
        "BEV": 797,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 3266,
        "PHEV": 10,
        "HEV": 210
      },
      "otros": {
        "BEV": 993,
        "PHEV": 44,
        "HEV": 895
      }
    }
  },
  {
    "periodo": "2019-11",
    "matriculaciones_mes": {
      "BEV": 3141,
      "PHEV": 883,
      "HEV": 11869,
      "REEV": 16,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 192,
      "PHEV": 57,
      "HEV": 759,
      "REEV": 1
    },
    "parque_acumulado": {
      "BEV": 88342,
      "PHEV": 36360,
      "HEV": 454798,
      "REEV": 1858,
      "FCEV": 4
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 52669,
        "PHEV": 30243,
        "HEV": 440754
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 251
      },
      "furgoneta_van": {
        "BEV": 11,
        "PHEV": 6043,
        "HEV": 11201
      },
      "moto": {
        "BEV": 15694,
        "HEV": 208
      },
      "camion": {
        "BEV": 6082,
        "PHEV": 42,
        "HEV": 1227
      },
      "autobus": {
        "BEV": 806,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 3338,
        "PHEV": 9,
        "HEV": 217
      },
      "otros": {
        "BEV": 1007,
        "PHEV": 44,
        "HEV": 935
      }
    }
  },
  {
    "periodo": "2019-12",
    "matriculaciones_mes": {
      "BEV": 2367,
      "PHEV": 854,
      "HEV": 11422,
      "REEV": 11
    },
    "bajas_mes": {
      "BEV": 224,
      "PHEV": 40,
      "HEV": 950,
      "REEV": 10
    },
    "parque_acumulado": {
      "BEV": 90485,
      "PHEV": 37174,
      "HEV": 465270,
      "REEV": 1859,
      "FCEV": 4
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 53577,
        "PHEV": 30788,
        "HEV": 450508
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 251
      },
      "furgoneta_van": {
        "BEV": 11,
        "PHEV": 6312,
        "HEV": 11747
      },
      "moto": {
        "BEV": 16184,
        "HEV": 210
      },
      "camion": {
        "BEV": 6138,
        "PHEV": 42,
        "HEV": 1320
      },
      "autobus": {
        "BEV": 814,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 3388,
        "PHEV": 8,
        "HEV": 218
      },
      "otros": {
        "BEV": 1005,
        "PHEV": 44,
        "HEV": 1011
      }
    }
  },
  {
    "periodo": "2020-01",
    "matriculaciones_mes": {
      "BEV": 2846,
      "PHEV": 1511,
      "HEV": 11961,
      "REEV": 20
    },
    "bajas_mes": {
      "BEV": 193,
      "PHEV": 75,
      "HEV": 654,
      "REEV": 10
    },
    "parque_acumulado": {
      "BEV": 93138,
      "PHEV": 38610,
      "HEV": 476577,
      "REEV": 1869,
      "FCEV": 4
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 55131,
        "PHEV": 32035,
        "HEV": 461154
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 251
      },
      "furgoneta_van": {
        "BEV": 11,
        "PHEV": 6501,
        "HEV": 12250
      },
      "moto": {
        "BEV": 16275,
        "HEV": 213
      },
      "camion": {
        "BEV": 6255,
        "PHEV": 42,
        "HEV": 1397
      },
      "autobus": {
        "BEV": 822,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 3428,
        "PHEV": 8,
        "HEV": 220
      },
      "otros": {
        "BEV": 1033,
        "PHEV": 44,
        "HEV": 1087
      }
    }
  },
  {
    "periodo": "2020-02",
    "matriculaciones_mes": {
      "BEV": 3118,
      "PHEV": 1283,
      "HEV": 12300,
      "REEV": 30,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 218,
      "PHEV": 61,
      "HEV": 787,
      "REEV": 8
    },
    "parque_acumulado": {
      "BEV": 96038,
      "PHEV": 39832,
      "HEV": 488090,
      "REEV": 1891,
      "FCEV": 5
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 56631,
        "PHEV": 33072,
        "HEV": 471806
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 251
      },
      "furgoneta_van": {
        "BEV": 11,
        "PHEV": 6687,
        "HEV": 12878
      },
      "moto": {
        "BEV": 16764,
        "HEV": 216
      },
      "camion": {
        "BEV": 6321,
        "PHEV": 42,
        "HEV": 1520
      },
      "autobus": {
        "BEV": 842,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 3507,
        "PHEV": 8,
        "HEV": 228
      },
      "otros": {
        "BEV": 1050,
        "PHEV": 44,
        "HEV": 1186
      }
    }
  },
  {
    "periodo": "2020-03",
    "matriculaciones_mes": {
      "BEV": 2096,
      "PHEV": 668,
      "HEV": 5925,
      "REEV": 10
    },
    "bajas_mes": {
      "BEV": 311,
      "PHEV": 66,
      "HEV": 821,
      "REEV": 6
    },
    "parque_acumulado": {
      "BEV": 97823,
      "PHEV": 40434,
      "HEV": 493194,
      "REEV": 1895,
      "FCEV": 5
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 57156,
        "PHEV": 33568,
        "HEV": 476573
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 251
      },
      "furgoneta_van": {
        "BEV": 11,
        "PHEV": 6794,
        "HEV": 13121
      },
      "moto": {
        "BEV": 17354,
        "HEV": 223
      },
      "camion": {
        "BEV": 6367,
        "PHEV": 42,
        "HEV": 1574
      },
      "autobus": {
        "BEV": 846,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 3554,
        "PHEV": 8,
        "HEV": 229
      },
      "otros": {
        "BEV": 1053,
        "PHEV": 44,
        "HEV": 1218
      }
    }
  },
  {
    "periodo": "2020-04",
    "matriculaciones_mes": {
      "BEV": 441,
      "PHEV": 69,
      "HEV": 348,
      "REEV": 2
    },
    "bajas_mes": {
      "BEV": 827,
      "PHEV": 9,
      "HEV": 245,
      "REEV": 4
    },
    "parque_acumulado": {
      "BEV": 97437,
      "PHEV": 40494,
      "HEV": 493297,
      "REEV": 1893,
      "FCEV": 5
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 57214,
        "PHEV": 33615,
        "HEV": 476599
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 251
      },
      "furgoneta_van": {
        "BEV": 11,
        "PHEV": 6807,
        "HEV": 13166
      },
      "moto": {
        "BEV": 17625,
        "HEV": 224
      },
      "camion": {
        "BEV": 6373,
        "PHEV": 42,
        "HEV": 1594
      },
      "autobus": {
        "BEV": 846,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 3605,
        "PHEV": 8,
        "HEV": 229
      },
      "otros": {
        "BEV": 1052,
        "PHEV": 44,
        "HEV": 1229
      }
    }
  },
  {
    "periodo": "2020-05",
    "matriculaciones_mes": {
      "BEV": 2169,
      "PHEV": 760,
      "HEV": 4761,
      "REEV": 10
    },
    "bajas_mes": {
      "BEV": 255,
      "PHEV": 31,
      "HEV": 389,
      "REEV": 2
    },
    "parque_acumulado": {
      "BEV": 99351,
      "PHEV": 41223,
      "HEV": 497669,
      "REEV": 1901,
      "FCEV": 5
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 57405,
        "PHEV": 34220,
        "HEV": 480624
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 251
      },
      "furgoneta_van": {
        "BEV": 11,
        "PHEV": 6930,
        "HEV": 13450
      },
      "moto": {
        "BEV": 19224,
        "HEV": 228
      },
      "camion": {
        "BEV": 6418,
        "PHEV": 42,
        "HEV": 1636
      },
      "autobus": {
        "BEV": 848,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 3680,
        "PHEV": 9,
        "HEV": 230
      },
      "otros": {
        "BEV": 1053,
        "PHEV": 44,
        "HEV": 1245
      }
    }
  },
  {
    "periodo": "2020-06",
    "matriculaciones_mes": {
      "BEV": 1909,
      "PHEV": 1510,
      "HEV": 12017,
      "REEV": 20
    },
    "bajas_mes": {
      "BEV": 136,
      "PHEV": 66,
      "HEV": 1012,
      "REEV": 6
    },
    "parque_acumulado": {
      "BEV": 101124,
      "PHEV": 42667,
      "HEV": 508674,
      "REEV": 1915,
      "FCEV": 5
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 58155,
        "PHEV": 35385,
        "HEV": 490805
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 261
      },
      "furgoneta_van": {
        "BEV": 11,
        "PHEV": 7211,
        "HEV": 14096
      },
      "moto": {
        "BEV": 19896,
        "HEV": 238
      },
      "camion": {
        "BEV": 6483,
        "PHEV": 42,
        "HEV": 1747
      },
      "autobus": {
        "BEV": 852,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 3778,
        "PHEV": 9,
        "HEV": 233
      },
      "otros": {
        "BEV": 1066,
        "PHEV": 44,
        "HEV": 1289
      }
    }
  },
  {
    "periodo": "2020-07",
    "matriculaciones_mes": {
      "BEV": 3257,
      "PHEV": 2442,
      "HEV": 18602,
      "REEV": 22
    },
    "bajas_mes": {
      "BEV": 527,
      "PHEV": 108,
      "HEV": 1239,
      "REEV": 6
    },
    "parque_acumulado": {
      "BEV": 103854,
      "PHEV": 45001,
      "HEV": 526037,
      "REEV": 1931,
      "FCEV": 5
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 59443,
        "PHEV": 37399,
        "HEV": 507155
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 278
      },
      "furgoneta_van": {
        "BEV": 11,
        "PHEV": 7532,
        "HEV": 14834
      },
      "moto": {
        "BEV": 21072,
        "HEV": 243
      },
      "camion": {
        "BEV": 6558,
        "PHEV": 42,
        "HEV": 1910
      },
      "autobus": {
        "BEV": 858,
        "PHEV": 2,
        "HEV": 6
      },
      "especial": {
        "BEV": 3865,
        "PHEV": 9,
        "HEV": 238
      },
      "otros": {
        "BEV": 1082,
        "PHEV": 44,
        "HEV": 1373
      }
    }
  },
  {
    "periodo": "2020-08",
    "matriculaciones_mes": {
      "BEV": 1991,
      "PHEV": 1372,
      "HEV": 10498,
      "REEV": 12
    },
    "bajas_mes": {
      "BEV": 376,
      "PHEV": 98,
      "HEV": 988,
      "REEV": 1
    },
    "parque_acumulado": {
      "BEV": 105469,
      "PHEV": 46275,
      "HEV": 535547,
      "REEV": 1942,
      "FCEV": 5
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 60356,
        "PHEV": 38427,
        "HEV": 516162
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 281
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 7779,
        "HEV": 15180
      },
      "moto": {
        "BEV": 21280,
        "HEV": 252
      },
      "camion": {
        "BEV": 6669,
        "PHEV": 42,
        "HEV": 1978
      },
      "autobus": {
        "BEV": 870,
        "PHEV": 2,
        "HEV": 7
      },
      "especial": {
        "BEV": 3887,
        "PHEV": 9,
        "HEV": 240
      },
      "otros": {
        "BEV": 1102,
        "PHEV": 44,
        "HEV": 1445
      }
    }
  },
  {
    "periodo": "2020-09",
    "matriculaciones_mes": {
      "BEV": 3274,
      "PHEV": 2028,
      "HEV": 12382,
      "REEV": 15
    },
    "bajas_mes": {
      "BEV": 244,
      "PHEV": 106,
      "HEV": 1558,
      "REEV": 4
    },
    "parque_acumulado": {
      "BEV": 108499,
      "PHEV": 48197,
      "HEV": 546371,
      "REEV": 1953,
      "FCEV": 5
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 62286,
        "PHEV": 40019,
        "HEV": 526267
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 284
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 8109,
        "HEV": 15617
      },
      "moto": {
        "BEV": 21726,
        "HEV": 253
      },
      "camion": {
        "BEV": 6924,
        "PHEV": 42,
        "HEV": 2126
      },
      "autobus": {
        "BEV": 887,
        "PHEV": 2,
        "HEV": 7
      },
      "especial": {
        "BEV": 3939,
        "PHEV": 9,
        "HEV": 245
      },
      "otros": {
        "BEV": 1101,
        "PHEV": 44,
        "HEV": 1570
      }
    }
  },
  {
    "periodo": "2020-10",
    "matriculaciones_mes": {
      "BEV": 2988,
      "PHEV": 2563,
      "HEV": 13684,
      "REEV": 24
    },
    "bajas_mes": {
      "BEV": 399,
      "PHEV": 116,
      "HEV": 1346,
      "REEV": 4
    },
    "parque_acumulado": {
      "BEV": 111088,
      "PHEV": 50644,
      "HEV": 558709,
      "REEV": 1973,
      "FCEV": 5
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 63959,
        "PHEV": 42190,
        "HEV": 537511
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 284
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 8379,
        "HEV": 16315
      },
      "moto": {
        "BEV": 22060,
        "HEV": 257
      },
      "camion": {
        "BEV": 7096,
        "PHEV": 46,
        "HEV": 2355
      },
      "autobus": {
        "BEV": 888,
        "PHEV": 2,
        "HEV": 7
      },
      "especial": {
        "BEV": 3993,
        "PHEV": 9,
        "HEV": 254
      },
      "otros": {
        "BEV": 1146,
        "PHEV": 44,
        "HEV": 1724
      }
    }
  },
  {
    "periodo": "2020-11",
    "matriculaciones_mes": {
      "BEV": 3026,
      "PHEV": 3084,
      "HEV": 15964,
      "REEV": 21,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 516,
      "PHEV": 198,
      "HEV": 1481,
      "REEV": 5
    },
    "parque_acumulado": {
      "BEV": 113598,
      "PHEV": 53530,
      "HEV": 573192,
      "REEV": 1989,
      "FCEV": 6
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 65561,
        "PHEV": 44705,
        "HEV": 550814
      },
      "suv_todo_terreno": {
        "BEV": 16,
        "HEV": 284
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 8748,
        "HEV": 16991
      },
      "moto": {
        "BEV": 22387,
        "HEV": 258
      },
      "camion": {
        "BEV": 7268,
        "PHEV": 50,
        "HEV": 2652
      },
      "autobus": {
        "BEV": 890,
        "PHEV": 2,
        "HEV": 7
      },
      "especial": {
        "BEV": 4050,
        "PHEV": 8,
        "HEV": 264
      },
      "otros": {
        "BEV": 1135,
        "PHEV": 46,
        "HEV": 1920
      }
    }
  },
  {
    "periodo": "2020-12",
    "matriculaciones_mes": {
      "BEV": 5373,
      "PHEV": 6549,
      "HEV": 23228,
      "REEV": 18,
      "FCEV": 5
    },
    "bajas_mes": {
      "BEV": 831,
      "PHEV": 169,
      "HEV": 1737,
      "REEV": 16
    },
    "parque_acumulado": {
      "BEV": 118140,
      "PHEV": 59910,
      "HEV": 594683,
      "REEV": 1991,
      "FCEV": 11
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 69308,
        "PHEV": 50452,
        "HEV": 570755
      },
      "suv_todo_terreno": {
        "BEV": 30,
        "HEV": 284
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 9381,
        "HEV": 18211
      },
      "moto": {
        "BEV": 22861,
        "HEV": 261
      },
      "camion": {
        "BEV": 7430,
        "PHEV": 50,
        "HEV": 2816
      },
      "autobus": {
        "BEV": 894,
        "PHEV": 2,
        "HEV": 7
      },
      "especial": {
        "BEV": 4090,
        "PHEV": 8,
        "HEV": 266
      },
      "otros": {
        "BEV": 1157,
        "PHEV": 46,
        "HEV": 2081
      }
    }
  },
  {
    "periodo": "2021-01",
    "matriculaciones_mes": {
      "BEV": 1094,
      "PHEV": 1469,
      "HEV": 9346,
      "REEV": 7
    },
    "bajas_mes": {
      "BEV": 435,
      "PHEV": 91,
      "HEV": 1182,
      "REEV": 7
    },
    "parque_acumulado": {
      "BEV": 118799,
      "PHEV": 61288,
      "HEV": 602847,
      "REEV": 1991,
      "FCEV": 11
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 69605,
        "PHEV": 51601,
        "HEV": 578268
      },
      "suv_todo_terreno": {
        "BEV": 30,
        "HEV": 283
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 9609,
        "HEV": 18681
      },
      "moto": {
        "BEV": 23148,
        "HEV": 263
      },
      "camion": {
        "BEV": 7471,
        "PHEV": 50,
        "HEV": 2892
      },
      "autobus": {
        "BEV": 902,
        "PHEV": 2,
        "HEV": 7
      },
      "especial": {
        "BEV": 4132,
        "PHEV": 9,
        "HEV": 273
      },
      "otros": {
        "BEV": 1163,
        "PHEV": 46,
        "HEV": 2178
      }
    }
  },
  {
    "periodo": "2021-02",
    "matriculaciones_mes": {
      "BEV": 1714,
      "PHEV": 2224,
      "HEV": 13657,
      "REEV": 16,
      "FCEV": 3
    },
    "bajas_mes": {
      "BEV": 1224,
      "PHEV": 120,
      "HEV": 1541,
      "REEV": 5
    },
    "parque_acumulado": {
      "BEV": 119289,
      "PHEV": 63392,
      "HEV": 614963,
      "REEV": 2002,
      "FCEV": 14
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 70120,
        "PHEV": 53394,
        "HEV": 589324
      },
      "suv_todo_terreno": {
        "BEV": 30,
        "HEV": 294
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 9920,
        "HEV": 19414
      },
      "moto": {
        "BEV": 22837,
        "HEV": 266
      },
      "camion": {
        "BEV": 7560,
        "PHEV": 50,
        "HEV": 3051
      },
      "autobus": {
        "BEV": 921,
        "PHEV": 2,
        "HEV": 7
      },
      "especial": {
        "BEV": 4206,
        "PHEV": 9,
        "HEV": 282
      },
      "otros": {
        "BEV": 1184,
        "PHEV": 46,
        "HEV": 2323
      }
    }
  },
  {
    "periodo": "2021-03",
    "matriculaciones_mes": {
      "BEV": 3447,
      "PHEV": 3645,
      "HEV": 19403,
      "REEV": 20
    },
    "bajas_mes": {
      "BEV": 484,
      "PHEV": 173,
      "HEV": 2619,
      "REEV": 10
    },
    "parque_acumulado": {
      "BEV": 122252,
      "PHEV": 66864,
      "HEV": 631747,
      "REEV": 2012,
      "FCEV": 14
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 71865,
        "PHEV": 56300,
        "HEV": 604767
      },
      "suv_todo_terreno": {
        "BEV": 30,
        "HEV": 301
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 10488,
        "HEV": 20341
      },
      "moto": {
        "BEV": 23557,
        "HEV": 266
      },
      "camion": {
        "BEV": 7668,
        "PHEV": 50,
        "HEV": 3270
      },
      "autobus": {
        "BEV": 943,
        "PHEV": 2,
        "HEV": 8
      },
      "especial": {
        "BEV": 4300,
        "PHEV": 9,
        "HEV": 287
      },
      "otros": {
        "BEV": 1193,
        "PHEV": 46,
        "HEV": 2505
      }
    }
  },
  {
    "periodo": "2021-04",
    "matriculaciones_mes": {
      "BEV": 2871,
      "PHEV": 3142,
      "HEV": 18776,
      "REEV": 16,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 566,
      "PHEV": 138,
      "HEV": 1632,
      "REEV": 9
    },
    "parque_acumulado": {
      "BEV": 124557,
      "PHEV": 69868,
      "HEV": 648891,
      "REEV": 2019,
      "FCEV": 15
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 73041,
        "PHEV": 58852,
        "HEV": 620427
      },
      "suv_todo_terreno": {
        "BEV": 30,
        "HEV": 301
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 10940,
        "HEV": 21408
      },
      "moto": {
        "BEV": 23915,
        "HEV": 267
      },
      "camion": {
        "BEV": 7928,
        "PHEV": 50,
        "HEV": 3513
      },
      "autobus": {
        "BEV": 969,
        "PHEV": 2,
        "HEV": 9
      },
      "especial": {
        "BEV": 4338,
        "PHEV": 9,
        "HEV": 290
      },
      "otros": {
        "BEV": 1201,
        "PHEV": 46,
        "HEV": 2674
      }
    }
  },
  {
    "periodo": "2021-05",
    "matriculaciones_mes": {
      "BEV": 3065,
      "PHEV": 4534,
      "HEV": 22739,
      "REEV": 11
    },
    "bajas_mes": {
      "BEV": 595,
      "PHEV": 222,
      "HEV": 2022,
      "REEV": 8
    },
    "parque_acumulado": {
      "BEV": 127027,
      "PHEV": 74180,
      "HEV": 669608,
      "REEV": 2022,
      "FCEV": 15
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 74649,
        "PHEV": 62577,
        "HEV": 640048
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 313
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 11527,
        "HEV": 22205
      },
      "moto": {
        "BEV": 24538,
        "HEV": 270
      },
      "camion": {
        "BEV": 8007,
        "PHEV": 50,
        "HEV": 3678
      },
      "autobus": {
        "BEV": 978,
        "PHEV": 2,
        "HEV": 9
      },
      "especial": {
        "BEV": 4411,
        "PHEV": 9,
        "HEV": 293
      },
      "otros": {
        "BEV": 1229,
        "PHEV": 46,
        "HEV": 2790
      }
    }
  },
  {
    "periodo": "2021-06",
    "matriculaciones_mes": {
      "BEV": 4837,
      "PHEV": 4553,
      "HEV": 26727,
      "REEV": 12,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 702,
      "PHEV": 278,
      "HEV": 2268,
      "REEV": 8
    },
    "parque_acumulado": {
      "BEV": 131162,
      "PHEV": 78455,
      "HEV": 694067,
      "REEV": 2026,
      "FCEV": 16
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 76836,
        "PHEV": 65990,
        "HEV": 663257
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 337
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 12387,
        "HEV": 23295
      },
      "moto": {
        "BEV": 25160,
        "HEV": 271
      },
      "camion": {
        "BEV": 8146,
        "PHEV": 50,
        "HEV": 3785
      },
      "autobus": {
        "BEV": 999,
        "PHEV": 2,
        "HEV": 9
      },
      "especial": {
        "BEV": 4470,
        "PHEV": 10,
        "HEV": 303
      },
      "otros": {
        "BEV": 1237,
        "PHEV": 47,
        "HEV": 2808
      }
    }
  },
  {
    "periodo": "2021-07",
    "matriculaciones_mes": {
      "BEV": 2916,
      "PHEV": 4123,
      "HEV": 21068,
      "REEV": 22
    },
    "bajas_mes": {
      "BEV": 636,
      "PHEV": 354,
      "HEV": 2066,
      "REEV": 6
    },
    "parque_acumulado": {
      "BEV": 133442,
      "PHEV": 82224,
      "HEV": 713069,
      "REEV": 2042,
      "FCEV": 16
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 78204,
        "PHEV": 69120,
        "HEV": 680947
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 337
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 13027,
        "HEV": 24387
      },
      "moto": {
        "BEV": 25454,
        "HEV": 272
      },
      "camion": {
        "BEV": 8432,
        "PHEV": 50,
        "HEV": 3907
      },
      "autobus": {
        "BEV": 1021,
        "PHEV": 2,
        "HEV": 9
      },
      "especial": {
        "BEV": 4527,
        "PHEV": 9,
        "HEV": 325
      },
      "otros": {
        "BEV": 1270,
        "PHEV": 48,
        "HEV": 2883
      }
    }
  },
  {
    "periodo": "2021-08",
    "matriculaciones_mes": {
      "BEV": 2204,
      "PHEV": 2769,
      "HEV": 14102,
      "REEV": 16
    },
    "bajas_mes": {
      "BEV": 272,
      "PHEV": 285,
      "HEV": 2050,
      "REEV": 8,
      "FCEV": 1
    },
    "parque_acumulado": {
      "BEV": 135374,
      "PHEV": 84708,
      "HEV": 725121,
      "REEV": 2050,
      "FCEV": 15
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 79381,
        "PHEV": 71184,
        "HEV": 692234
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 337
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 13446,
        "HEV": 25038
      },
      "moto": {
        "BEV": 25911,
        "HEV": 272
      },
      "camion": {
        "BEV": 8504,
        "PHEV": 51,
        "HEV": 3981
      },
      "autobus": {
        "BEV": 1027,
        "PHEV": 2,
        "HEV": 9
      },
      "especial": {
        "BEV": 4556,
        "PHEV": 9,
        "HEV": 329
      },
      "otros": {
        "BEV": 1300,
        "PHEV": 48,
        "HEV": 2919
      }
    }
  },
  {
    "periodo": "2021-09",
    "matriculaciones_mes": {
      "BEV": 4148,
      "PHEV": 4039,
      "HEV": 16685,
      "REEV": 9,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 537,
      "PHEV": 338,
      "HEV": 2256,
      "REEV": 9
    },
    "parque_acumulado": {
      "BEV": 138985,
      "PHEV": 88409,
      "HEV": 739550,
      "REEV": 2050,
      "FCEV": 16
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 81977,
        "PHEV": 74252,
        "HEV": 705572
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 337
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 14078,
        "HEV": 25937
      },
      "moto": {
        "BEV": 26387,
        "HEV": 274
      },
      "camion": {
        "BEV": 8587,
        "PHEV": 51,
        "HEV": 4079
      },
      "autobus": {
        "BEV": 1047,
        "PHEV": 2,
        "HEV": 9
      },
      "especial": {
        "BEV": 4619,
        "PHEV": 10,
        "HEV": 340
      },
      "otros": {
        "BEV": 1333,
        "PHEV": 48,
        "HEV": 3000
      }
    }
  },
  {
    "periodo": "2021-10",
    "matriculaciones_mes": {
      "BEV": 3671,
      "PHEV": 4285,
      "HEV": 17869,
      "REEV": 20,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 2039,
      "PHEV": 393,
      "HEV": 2088,
      "REEV": 5
    },
    "parque_acumulado": {
      "BEV": 140617,
      "PHEV": 92301,
      "HEV": 755331,
      "REEV": 2065,
      "FCEV": 17
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 84168,
        "PHEV": 77555,
        "HEV": 720240
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 346
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 14669,
        "HEV": 26834
      },
      "moto": {
        "BEV": 25344,
        "HEV": 275
      },
      "camion": {
        "BEV": 8709,
        "PHEV": 51,
        "HEV": 4196
      },
      "autobus": {
        "BEV": 1058,
        "PHEV": 2,
        "HEV": 9
      },
      "especial": {
        "BEV": 4675,
        "PHEV": 12,
        "HEV": 348
      },
      "otros": {
        "BEV": 1324,
        "PHEV": 48,
        "HEV": 3081
      }
    }
  },
  {
    "periodo": "2021-11",
    "matriculaciones_mes": {
      "BEV": 4231,
      "PHEV": 4464,
      "HEV": 19260,
      "REEV": 13,
      "FCEV": 2
    },
    "bajas_mes": {
      "BEV": 853,
      "PHEV": 397,
      "HEV": 2441,
      "REEV": 6
    },
    "parque_acumulado": {
      "BEV": 143995,
      "PHEV": 96368,
      "HEV": 772150,
      "REEV": 2072,
      "FCEV": 19
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 86709,
        "PHEV": 81102,
        "HEV": 735911
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 346
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 15187,
        "HEV": 27715
      },
      "moto": {
        "BEV": 25697,
        "HEV": 275
      },
      "camion": {
        "BEV": 8868,
        "PHEV": 52,
        "HEV": 4346
      },
      "autobus": {
        "BEV": 1071,
        "PHEV": 2,
        "HEV": 9
      },
      "especial": {
        "BEV": 4741,
        "PHEV": 12,
        "HEV": 354
      },
      "otros": {
        "BEV": 1341,
        "PHEV": 48,
        "HEV": 3192
      }
    }
  },
  {
    "periodo": "2021-12",
    "matriculaciones_mes": {
      "BEV": 5361,
      "PHEV": 4892,
      "HEV": 25581,
      "REEV": 19,
      "FCEV": 2
    },
    "bajas_mes": {
      "BEV": 674,
      "PHEV": 430,
      "HEV": 3142,
      "REEV": 4
    },
    "parque_acumulado": {
      "BEV": 148682,
      "PHEV": 100830,
      "HEV": 794589,
      "REEV": 2087,
      "FCEV": 21
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 89869,
        "PHEV": 84908,
        "HEV": 757085
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 348
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 15844,
        "HEV": 28773
      },
      "moto": {
        "BEV": 26362,
        "HEV": 276
      },
      "camion": {
        "BEV": 9225,
        "PHEV": 52,
        "HEV": 4485
      },
      "autobus": {
        "BEV": 1092,
        "PHEV": 2,
        "HEV": 9
      },
      "especial": {
        "BEV": 4793,
        "PHEV": 12,
        "HEV": 364
      },
      "otros": {
        "BEV": 1365,
        "PHEV": 50,
        "HEV": 3247
      }
    }
  },
  {
    "periodo": "2022-01",
    "matriculaciones_mes": {
      "BEV": 3564,
      "PHEV": 3273,
      "HEV": 13678,
      "REEV": 16,
      "FCEV": 2
    },
    "bajas_mes": {
      "BEV": 1550,
      "PHEV": 306,
      "HEV": 1648,
      "REEV": 8
    },
    "parque_acumulado": {
      "BEV": 150696,
      "PHEV": 103797,
      "HEV": 806619,
      "REEV": 2095,
      "FCEV": 23
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 91294,
        "PHEV": 87503,
        "HEV": 768509
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 348
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 16213,
        "HEV": 29209
      },
      "moto": {
        "BEV": 26343,
        "HEV": 276
      },
      "camion": {
        "BEV": 9375,
        "PHEV": 52,
        "HEV": 4582
      },
      "autobus": {
        "BEV": 1203,
        "PHEV": 2,
        "HEV": 9
      },
      "especial": {
        "BEV": 4852,
        "PHEV": 13,
        "HEV": 374
      },
      "otros": {
        "BEV": 1383,
        "PHEV": 53,
        "HEV": 3310
      }
    }
  },
  {
    "periodo": "2022-02",
    "matriculaciones_mes": {
      "BEV": 3841,
      "PHEV": 3993,
      "HEV": 17699,
      "REEV": 12,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 1299,
      "PHEV": 310,
      "HEV": 1743,
      "REEV": 7
    },
    "parque_acumulado": {
      "BEV": 153238,
      "PHEV": 107480,
      "HEV": 822575,
      "REEV": 2100,
      "FCEV": 24
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 93382,
        "PHEV": 90439,
        "HEV": 783558
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 348
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 16942,
        "HEV": 29874
      },
      "moto": {
        "BEV": 26060,
        "HEV": 276
      },
      "camion": {
        "BEV": 9571,
        "PHEV": 52,
        "HEV": 4701
      },
      "autobus": {
        "BEV": 1216,
        "PHEV": 2,
        "HEV": 9
      },
      "especial": {
        "BEV": 4919,
        "PHEV": 13,
        "HEV": 379
      },
      "otros": {
        "BEV": 1400,
        "PHEV": 71,
        "HEV": 3428
      }
    }
  },
  {
    "periodo": "2022-03",
    "matriculaciones_mes": {
      "BEV": 5043,
      "PHEV": 3459,
      "HEV": 17123,
      "REEV": 15,
      "FCEV": 7
    },
    "bajas_mes": {
      "BEV": 1046,
      "PHEV": 446,
      "HEV": 2639,
      "REEV": 9
    },
    "parque_acumulado": {
      "BEV": 157235,
      "PHEV": 110493,
      "HEV": 837059,
      "REEV": 2106,
      "FCEV": 31
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 96224,
        "PHEV": 92946,
        "HEV": 797228
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 348
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 17421,
        "HEV": 30420
      },
      "moto": {
        "BEV": 26846,
        "HEV": 276
      },
      "camion": {
        "BEV": 9653,
        "PHEV": 53,
        "HEV": 4876
      },
      "autobus": {
        "BEV": 1245,
        "PHEV": 2,
        "HEV": 10
      },
      "especial": {
        "BEV": 5010,
        "PHEV": 13,
        "HEV": 392
      },
      "otros": {
        "BEV": 1449,
        "PHEV": 96,
        "HEV": 3507
      }
    }
  },
  {
    "periodo": "2022-04",
    "matriculaciones_mes": {
      "BEV": 3333,
      "PHEV": 4291,
      "HEV": 19371,
      "REEV": 11
    },
    "bajas_mes": {
      "BEV": 866,
      "PHEV": 414,
      "HEV": 1462,
      "REEV": 6
    },
    "parque_acumulado": {
      "BEV": 159702,
      "PHEV": 114370,
      "HEV": 854968,
      "REEV": 2111,
      "FCEV": 31
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 97755,
        "PHEV": 96123,
        "HEV": 813816
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 348
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 18108,
        "HEV": 31488
      },
      "moto": {
        "BEV": 27467,
        "HEV": 276
      },
      "camion": {
        "BEV": 9744,
        "PHEV": 54,
        "HEV": 5034
      },
      "autobus": {
        "BEV": 1275,
        "PHEV": 2,
        "HEV": 10
      },
      "especial": {
        "BEV": 5061,
        "PHEV": 15,
        "HEV": 396
      },
      "otros": {
        "BEV": 1464,
        "PHEV": 106,
        "HEV": 3598
      }
    }
  },
  {
    "periodo": "2022-05",
    "matriculaciones_mes": {
      "BEV": 3612,
      "PHEV": 4921,
      "HEV": 25553,
      "REEV": 21
    },
    "bajas_mes": {
      "BEV": 1135,
      "PHEV": 420,
      "HEV": 2247,
      "REEV": 13
    },
    "parque_acumulado": {
      "BEV": 162179,
      "PHEV": 118871,
      "HEV": 878274,
      "REEV": 2119,
      "FCEV": 31
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 99311,
        "PHEV": 99741,
        "HEV": 835442
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 367
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 18970,
        "HEV": 32668
      },
      "moto": {
        "BEV": 27906,
        "HEV": 277
      },
      "camion": {
        "BEV": 9924,
        "PHEV": 54,
        "HEV": 5356
      },
      "autobus": {
        "BEV": 1307,
        "PHEV": 2,
        "HEV": 10
      },
      "especial": {
        "BEV": 5140,
        "PHEV": 14,
        "HEV": 401
      },
      "otros": {
        "BEV": 1459,
        "PHEV": 127,
        "HEV": 3751
      }
    }
  },
  {
    "periodo": "2022-06",
    "matriculaciones_mes": {
      "BEV": 5150,
      "PHEV": 4370,
      "HEV": 25690,
      "REEV": 16
    },
    "bajas_mes": {
      "BEV": 797,
      "PHEV": 530,
      "HEV": 1765,
      "REEV": 8
    },
    "parque_acumulado": {
      "BEV": 166532,
      "PHEV": 122711,
      "HEV": 902199,
      "REEV": 2127,
      "FCEV": 31
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 102097,
        "PHEV": 102761,
        "HEV": 857931
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 367
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 19777,
        "HEV": 33745
      },
      "moto": {
        "BEV": 28665,
        "HEV": 277
      },
      "camion": {
        "BEV": 10110,
        "PHEV": 54,
        "HEV": 5580
      },
      "autobus": {
        "BEV": 1325,
        "PHEV": 2,
        "HEV": 10
      },
      "especial": {
        "BEV": 5227,
        "PHEV": 16,
        "HEV": 409
      },
      "otros": {
        "BEV": 1471,
        "PHEV": 138,
        "HEV": 3878
      }
    }
  },
  {
    "periodo": "2022-07",
    "matriculaciones_mes": {
      "BEV": 4060,
      "PHEV": 3724,
      "HEV": 20720,
      "REEV": 18
    },
    "bajas_mes": {
      "BEV": 646,
      "PHEV": 388,
      "HEV": 1585,
      "REEV": 9
    },
    "parque_acumulado": {
      "BEV": 169946,
      "PHEV": 126047,
      "HEV": 921334,
      "REEV": 2136,
      "FCEV": 31
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 103850,
        "PHEV": 105399,
        "HEV": 875847
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 370
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 20473,
        "HEV": 34725
      },
      "moto": {
        "BEV": 29567,
        "HEV": 278
      },
      "camion": {
        "BEV": 10334,
        "PHEV": 54,
        "HEV": 5731
      },
      "autobus": {
        "BEV": 1381,
        "PHEV": 2,
        "HEV": 10
      },
      "especial": {
        "BEV": 5346,
        "PHEV": 17,
        "HEV": 413
      },
      "otros": {
        "BEV": 1535,
        "PHEV": 138,
        "HEV": 3958
      }
    }
  },
  {
    "periodo": "2022-08",
    "matriculaciones_mes": {
      "BEV": 2908,
      "PHEV": 2840,
      "HEV": 16128,
      "REEV": 10
    },
    "bajas_mes": {
      "BEV": 608,
      "PHEV": 349,
      "HEV": 1531,
      "REEV": 7
    },
    "parque_acumulado": {
      "BEV": 172246,
      "PHEV": 128538,
      "HEV": 935931,
      "REEV": 2139,
      "FCEV": 31
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 104887,
        "PHEV": 107585,
        "HEV": 889567
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 382
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 20776,
        "HEV": 35417
      },
      "moto": {
        "BEV": 30241,
        "HEV": 279
      },
      "camion": {
        "BEV": 10528,
        "PHEV": 54,
        "HEV": 5840
      },
      "autobus": {
        "BEV": 1422,
        "PHEV": 2,
        "HEV": 10
      },
      "especial": {
        "BEV": 5395,
        "PHEV": 17,
        "HEV": 414
      },
      "otros": {
        "BEV": 1573,
        "PHEV": 140,
        "HEV": 4020
      }
    }
  },
  {
    "periodo": "2022-09",
    "matriculaciones_mes": {
      "BEV": 4940,
      "PHEV": 4274,
      "HEV": 21452,
      "REEV": 21
    },
    "bajas_mes": {
      "BEV": 672,
      "PHEV": 480,
      "HEV": 1854,
      "REEV": 3
    },
    "parque_acumulado": {
      "BEV": 176514,
      "PHEV": 132332,
      "HEV": 955529,
      "REEV": 2157,
      "FCEV": 31
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 107912,
        "PHEV": 110864,
        "HEV": 908118
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 382
      },
      "furgoneta_van": {
        "BEV": 12,
        "PHEV": 21282,
        "HEV": 36262
      },
      "moto": {
        "BEV": 30851,
        "HEV": 279
      },
      "camion": {
        "BEV": 10795,
        "PHEV": 55,
        "HEV": 5973
      },
      "autobus": {
        "BEV": 1478,
        "PHEV": 2,
        "HEV": 10
      },
      "especial": {
        "BEV": 5468,
        "PHEV": 18,
        "HEV": 415
      },
      "otros": {
        "BEV": 1592,
        "PHEV": 147,
        "HEV": 4088
      }
    }
  },
  {
    "periodo": "2022-10",
    "matriculaciones_mes": {
      "BEV": 4389,
      "PHEV": 4086,
      "HEV": 21089,
      "REEV": 23
    },
    "bajas_mes": {
      "BEV": 433,
      "PHEV": 393,
      "HEV": 2858,
      "REEV": 11
    },
    "parque_acumulado": {
      "BEV": 180470,
      "PHEV": 136025,
      "HEV": 973760,
      "REEV": 2169,
      "FCEV": 31
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 110441,
        "PHEV": 114008,
        "HEV": 925269
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 382
      },
      "furgoneta_van": {
        "BEV": 14,
        "PHEV": 21833,
        "HEV": 37129
      },
      "moto": {
        "BEV": 31473,
        "HEV": 279
      },
      "camion": {
        "BEV": 11052,
        "PHEV": 55,
        "HEV": 6091
      },
      "autobus": {
        "BEV": 1511,
        "PHEV": 2,
        "HEV": 10
      },
      "especial": {
        "BEV": 5551,
        "PHEV": 18,
        "HEV": 414
      },
      "otros": {
        "BEV": 1642,
        "PHEV": 145,
        "HEV": 4184
      }
    }
  },
  {
    "periodo": "2022-11",
    "matriculaciones_mes": {
      "BEV": 5254,
      "PHEV": 4921,
      "HEV": 25328,
      "REEV": 12
    },
    "bajas_mes": {
      "BEV": 473,
      "PHEV": 454,
      "HEV": 4260,
      "REEV": 7
    },
    "parque_acumulado": {
      "BEV": 185251,
      "PHEV": 140492,
      "HEV": 994828,
      "REEV": 2174,
      "FCEV": 31
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 113616,
        "PHEV": 117931,
        "HEV": 945165
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 382
      },
      "furgoneta_van": {
        "BEV": 14,
        "PHEV": 22375,
        "HEV": 38138
      },
      "moto": {
        "BEV": 32235,
        "HEV": 278
      },
      "camion": {
        "BEV": 11317,
        "PHEV": 55,
        "HEV": 6186
      },
      "autobus": {
        "BEV": 1576,
        "PHEV": 2,
        "HEV": 10
      },
      "especial": {
        "BEV": 5622,
        "PHEV": 18,
        "HEV": 414
      },
      "otros": {
        "BEV": 1684,
        "PHEV": 147,
        "HEV": 4253
      }
    }
  },
  {
    "periodo": "2022-12",
    "matriculaciones_mes": {
      "BEV": 5453,
      "PHEV": 4755,
      "HEV": 22995,
      "REEV": 11,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 1269,
      "PHEV": 602,
      "HEV": 4738,
      "REEV": 7
    },
    "parque_acumulado": {
      "BEV": 189435,
      "PHEV": 144645,
      "HEV": 1013085,
      "REEV": 2178,
      "FCEV": 32
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 116848,
        "PHEV": 121625,
        "HEV": 961903
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 382
      },
      "furgoneta_van": {
        "BEV": 14,
        "PHEV": 22836,
        "HEV": 39519
      },
      "moto": {
        "BEV": 32734,
        "HEV": 274
      },
      "camion": {
        "BEV": 11692,
        "PHEV": 55,
        "HEV": 6279
      },
      "autobus": {
        "BEV": 1604,
        "PHEV": 2,
        "HEV": 15
      },
      "especial": {
        "BEV": 5677,
        "PHEV": 18,
        "HEV": 414
      },
      "otros": {
        "BEV": 1697,
        "PHEV": 146,
        "HEV": 4297
      }
    }
  },
  {
    "periodo": "2023-01",
    "matriculaciones_mes": {
      "BEV": 4784,
      "PHEV": 4237,
      "HEV": 21333,
      "REEV": 10,
      "FCEV": 4
    },
    "bajas_mes": {
      "BEV": 833,
      "PHEV": 418,
      "HEV": 2654,
      "REEV": 4
    },
    "parque_acumulado": {
      "BEV": 193386,
      "PHEV": 148464,
      "HEV": 1031764,
      "REEV": 2184,
      "FCEV": 36
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 120040,
        "PHEV": 124789,
        "HEV": 979594
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 382
      },
      "furgoneta_van": {
        "BEV": 14,
        "PHEV": 23491,
        "HEV": 40425
      },
      "moto": {
        "BEV": 32854,
        "HEV": 273
      },
      "camion": {
        "BEV": 12092,
        "PHEV": 55,
        "HEV": 6330
      },
      "autobus": {
        "BEV": 1619,
        "PHEV": 2,
        "HEV": 15
      },
      "especial": {
        "BEV": 5740,
        "PHEV": 18,
        "HEV": 415
      },
      "otros": {
        "BEV": 1734,
        "PHEV": 146,
        "HEV": 4328
      }
    }
  },
  {
    "periodo": "2023-02",
    "matriculaciones_mes": {
      "BEV": 5228,
      "PHEV": 4951,
      "HEV": 23323,
      "REEV": 10
    },
    "bajas_mes": {
      "BEV": 1494,
      "PHEV": 486,
      "HEV": 3420,
      "REEV": 5
    },
    "parque_acumulado": {
      "BEV": 197120,
      "PHEV": 152929,
      "HEV": 1051667,
      "REEV": 2189,
      "FCEV": 36
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 123348,
        "PHEV": 128548,
        "HEV": 998530
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 395
      },
      "furgoneta_van": {
        "BEV": 14,
        "PHEV": 24191,
        "HEV": 41202
      },
      "moto": {
        "BEV": 32761,
        "HEV": 298
      },
      "camion": {
        "BEV": 12500,
        "PHEV": 56,
        "HEV": 6443
      },
      "autobus": {
        "BEV": 1656,
        "PHEV": 2,
        "HEV": 16
      },
      "especial": {
        "BEV": 5850,
        "PHEV": 17,
        "HEV": 417
      },
      "otros": {
        "BEV": 1725,
        "PHEV": 152,
        "HEV": 4364
      }
    }
  },
  {
    "periodo": "2023-03",
    "matriculaciones_mes": {
      "BEV": 6644,
      "PHEV": 6193,
      "HEV": 29801,
      "REEV": 8,
      "FCEV": 7
    },
    "bajas_mes": {
      "BEV": 1109,
      "PHEV": 551,
      "HEV": 3116,
      "REEV": 6
    },
    "parque_acumulado": {
      "BEV": 202655,
      "PHEV": 158571,
      "HEV": 1078352,
      "REEV": 2191,
      "FCEV": 43
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 127817,
        "PHEV": 133532,
        "HEV": 1023963
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 410
      },
      "furgoneta_van": {
        "BEV": 13,
        "PHEV": 24838,
        "HEV": 42116
      },
      "moto": {
        "BEV": 32751,
        "HEV": 298
      },
      "camion": {
        "BEV": 13122,
        "PHEV": 56,
        "HEV": 6674
      },
      "autobus": {
        "BEV": 1701,
        "PHEV": 2,
        "HEV": 16
      },
      "especial": {
        "BEV": 5960,
        "PHEV": 17,
        "HEV": 416
      },
      "otros": {
        "BEV": 1815,
        "PHEV": 163,
        "HEV": 4456
      }
    }
  },
  {
    "periodo": "2023-04",
    "matriculaciones_mes": {
      "BEV": 5406,
      "PHEV": 4514,
      "HEV": 22653,
      "REEV": 13,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 555,
      "PHEV": 409,
      "HEV": 2415,
      "REEV": 6
    },
    "parque_acumulado": {
      "BEV": 207506,
      "PHEV": 162676,
      "HEV": 1098590,
      "REEV": 2198,
      "FCEV": 44
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 131347,
        "PHEV": 137045,
        "HEV": 1043157
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 414
      },
      "furgoneta_van": {
        "BEV": 13,
        "PHEV": 25423,
        "HEV": 42930
      },
      "moto": {
        "BEV": 33402,
        "HEV": 319
      },
      "camion": {
        "BEV": 13381,
        "PHEV": 56,
        "HEV": 6797
      },
      "autobus": {
        "BEV": 1721,
        "PHEV": 2,
        "HEV": 16
      },
      "especial": {
        "BEV": 6033,
        "PHEV": 17,
        "HEV": 415
      },
      "otros": {
        "BEV": 1878,
        "PHEV": 170,
        "HEV": 4539
      }
    }
  },
  {
    "periodo": "2023-05",
    "matriculaciones_mes": {
      "BEV": 7160,
      "PHEV": 6244,
      "HEV": 27895,
      "REEV": 5
    },
    "bajas_mes": {
      "BEV": 1527,
      "PHEV": 558,
      "HEV": 3407,
      "REEV": 6
    },
    "parque_acumulado": {
      "BEV": 213139,
      "PHEV": 168362,
      "HEV": 1123078,
      "REEV": 2197,
      "FCEV": 44
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 135748,
        "PHEV": 142051,
        "HEV": 1066482
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 418
      },
      "furgoneta_van": {
        "BEV": 13,
        "PHEV": 26061,
        "HEV": 43883
      },
      "moto": {
        "BEV": 32968,
        "HEV": 336
      },
      "camion": {
        "BEV": 13638,
        "PHEV": 56,
        "HEV": 6900
      },
      "autobus": {
        "BEV": 1781,
        "PHEV": 2,
        "HEV": 16
      },
      "especial": {
        "BEV": 6139,
        "PHEV": 17,
        "HEV": 412
      },
      "otros": {
        "BEV": 1910,
        "PHEV": 213,
        "HEV": 4628
      }
    }
  },
  {
    "periodo": "2023-06",
    "matriculaciones_mes": {
      "BEV": 7828,
      "PHEV": 6677,
      "HEV": 31248,
      "REEV": 12
    },
    "bajas_mes": {
      "BEV": 933,
      "PHEV": 477,
      "HEV": 3140,
      "REEV": 4
    },
    "parque_acumulado": {
      "BEV": 220034,
      "PHEV": 174562,
      "HEV": 1151186,
      "REEV": 2205,
      "FCEV": 44
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 141551,
        "PHEV": 147432,
        "HEV": 1093240
      },
      "suv_todo_terreno": {
        "BEV": 31,
        "HEV": 418
      },
      "furgoneta_van": {
        "BEV": 13,
        "PHEV": 26873,
        "HEV": 44919
      },
      "moto": {
        "BEV": 33171,
        "HEV": 349
      },
      "camion": {
        "BEV": 14035,
        "PHEV": 56,
        "HEV": 7085
      },
      "autobus": {
        "BEV": 1850,
        "PHEV": 2,
        "HEV": 16
      },
      "especial": {
        "BEV": 6250,
        "PHEV": 17,
        "HEV": 411
      },
      "otros": {
        "BEV": 1953,
        "PHEV": 220,
        "HEV": 4745
      }
    }
  },
  {
    "periodo": "2023-07",
    "matriculaciones_mes": {
      "BEV": 5761,
      "PHEV": 5399,
      "HEV": 27112,
      "REEV": 16,
      "FCEV": 3
    },
    "bajas_mes": {
      "BEV": 508,
      "PHEV": 677,
      "HEV": 3443,
      "REEV": 4
    },
    "parque_acumulado": {
      "BEV": 225287,
      "PHEV": 179284,
      "HEV": 1174855,
      "REEV": 2217,
      "FCEV": 47
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 145003,
        "PHEV": 151618,
        "HEV": 1115458
      },
      "suv_todo_terreno": {
        "BEV": 32,
        "HEV": 430
      },
      "furgoneta_van": {
        "BEV": 13,
        "PHEV": 27397,
        "HEV": 45938
      },
      "moto": {
        "BEV": 33702,
        "HEV": 350
      },
      "camion": {
        "BEV": 14357,
        "PHEV": 56,
        "HEV": 7402
      },
      "autobus": {
        "BEV": 1871,
        "PHEV": 2,
        "HEV": 16
      },
      "especial": {
        "BEV": 6394,
        "PHEV": 17,
        "HEV": 409
      },
      "otros": {
        "BEV": 2017,
        "PHEV": 233,
        "HEV": 4849
      }
    }
  },
  {
    "periodo": "2023-08",
    "matriculaciones_mes": {
      "BEV": 5478,
      "PHEV": 3607,
      "HEV": 19535,
      "REEV": 6
    },
    "bajas_mes": {
      "BEV": 427,
      "PHEV": 639,
      "HEV": 2626,
      "REEV": 4
    },
    "parque_acumulado": {
      "BEV": 230338,
      "PHEV": 182252,
      "HEV": 1191764,
      "REEV": 2219,
      "FCEV": 47
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 148593,
        "PHEV": 154209,
        "HEV": 1131296
      },
      "suv_todo_terreno": {
        "BEV": 32,
        "HEV": 432
      },
      "furgoneta_van": {
        "BEV": 13,
        "PHEV": 27769,
        "HEV": 46696
      },
      "moto": {
        "BEV": 34244,
        "HEV": 350
      },
      "camion": {
        "BEV": 14555,
        "PHEV": 56,
        "HEV": 7584
      },
      "autobus": {
        "BEV": 1914,
        "PHEV": 2,
        "HEV": 16
      },
      "especial": {
        "BEV": 6480,
        "PHEV": 17,
        "HEV": 408
      },
      "otros": {
        "BEV": 2065,
        "PHEV": 238,
        "HEV": 4979
      }
    }
  },
  {
    "periodo": "2023-09",
    "matriculaciones_mes": {
      "BEV": 5642,
      "PHEV": 4781,
      "HEV": 22978,
      "REEV": 6,
      "FCEV": 2
    },
    "bajas_mes": {
      "BEV": 889,
      "PHEV": 482,
      "HEV": 2989,
      "REEV": 7
    },
    "parque_acumulado": {
      "BEV": 235091,
      "PHEV": 186551,
      "HEV": 1211753,
      "REEV": 2218,
      "FCEV": 49
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 152252,
        "PHEV": 157905,
        "HEV": 1149817
      },
      "suv_todo_terreno": {
        "BEV": 32,
        "HEV": 435
      },
      "furgoneta_van": {
        "BEV": 14,
        "PHEV": 28368,
        "HEV": 47771
      },
      "moto": {
        "BEV": 34987,
        "HEV": 350
      },
      "camion": {
        "BEV": 14854,
        "PHEV": 56,
        "HEV": 7794
      },
      "autobus": {
        "BEV": 1936,
        "PHEV": 2,
        "HEV": 16
      },
      "especial": {
        "BEV": 6589,
        "PHEV": 17,
        "HEV": 409
      },
      "otros": {
        "BEV": 2076,
        "PHEV": 243,
        "HEV": 5158
      }
    }
  },
  {
    "periodo": "2023-10",
    "matriculaciones_mes": {
      "BEV": 8115,
      "PHEV": 5739,
      "HEV": 29951,
      "REEV": 4,
      "FCEV": 2
    },
    "bajas_mes": {
      "BEV": 818,
      "PHEV": 498,
      "HEV": 3887,
      "REEV": 3
    },
    "parque_acumulado": {
      "BEV": 242388,
      "PHEV": 191792,
      "HEV": 1237817,
      "REEV": 2219,
      "FCEV": 51
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 157686,
        "PHEV": 162170,
        "HEV": 1174546
      },
      "suv_todo_terreno": {
        "BEV": 32,
        "HEV": 439
      },
      "furgoneta_van": {
        "BEV": 15,
        "PHEV": 29318,
        "HEV": 48720
      },
      "moto": {
        "BEV": 36049,
        "HEV": 349
      },
      "camion": {
        "BEV": 15312,
        "PHEV": 68,
        "HEV": 7947
      },
      "autobus": {
        "BEV": 1958,
        "PHEV": 2,
        "HEV": 16
      },
      "especial": {
        "BEV": 6709,
        "PHEV": 18,
        "HEV": 409
      },
      "otros": {
        "BEV": 2145,
        "PHEV": 257,
        "HEV": 5388
      }
    }
  },
  {
    "periodo": "2023-11",
    "matriculaciones_mes": {
      "BEV": 8432,
      "PHEV": 6025,
      "HEV": 27776,
      "REEV": 12,
      "FCEV": 2
    },
    "bajas_mes": {
      "BEV": 926,
      "PHEV": 620,
      "HEV": 4780,
      "REEV": 5
    },
    "parque_acumulado": {
      "BEV": 249894,
      "PHEV": 197197,
      "HEV": 1260813,
      "REEV": 2226,
      "FCEV": 53
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 163799,
        "PHEV": 166879,
        "HEV": 1196073
      },
      "suv_todo_terreno": {
        "BEV": 32,
        "HEV": 439
      },
      "furgoneta_van": {
        "BEV": 15,
        "PHEV": 30011,
        "HEV": 49831
      },
      "moto": {
        "BEV": 36593,
        "HEV": 348
      },
      "camion": {
        "BEV": 15852,
        "PHEV": 69,
        "HEV": 8141
      },
      "autobus": {
        "BEV": 1975,
        "PHEV": 2,
        "HEV": 16
      },
      "especial": {
        "BEV": 6797,
        "PHEV": 18,
        "HEV": 408
      },
      "otros": {
        "BEV": 2213,
        "PHEV": 260,
        "HEV": 5554
      }
    }
  },
  {
    "periodo": "2023-12",
    "matriculaciones_mes": {
      "BEV": 7772,
      "PHEV": 6994,
      "HEV": 28701,
      "REEV": 6,
      "FCEV": 3
    },
    "bajas_mes": {
      "BEV": 1481,
      "PHEV": 637,
      "HEV": 4364,
      "REEV": 10
    },
    "parque_acumulado": {
      "BEV": 256185,
      "PHEV": 203554,
      "HEV": 1285150,
      "REEV": 2222,
      "FCEV": 56
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 169617,
        "PHEV": 172504,
        "HEV": 1219070
      },
      "suv_todo_terreno": {
        "BEV": 32,
        "HEV": 439
      },
      "furgoneta_van": {
        "BEV": 15,
        "PHEV": 30739,
        "HEV": 50922
      },
      "moto": {
        "BEV": 36552,
        "HEV": 347
      },
      "camion": {
        "BEV": 16293,
        "PHEV": 74,
        "HEV": 8273
      },
      "autobus": {
        "BEV": 1982,
        "PHEV": 2,
        "HEV": 16
      },
      "especial": {
        "BEV": 6861,
        "PHEV": 18,
        "HEV": 407
      },
      "otros": {
        "BEV": 2243,
        "PHEV": 260,
        "HEV": 5673
      }
    }
  },
  {
    "periodo": "2024-01",
    "matriculaciones_mes": {
      "BEV": 4761,
      "PHEV": 4976,
      "HEV": 27136,
      "REEV": 10,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 681,
      "PHEV": 605,
      "HEV": 3626,
      "REEV": 5
    },
    "parque_acumulado": {
      "BEV": 260265,
      "PHEV": 207925,
      "HEV": 1308660,
      "REEV": 2227,
      "FCEV": 57
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 172834,
        "PHEV": 176119,
        "HEV": 1241423
      },
      "suv_todo_terreno": {
        "BEV": 32,
        "HEV": 439
      },
      "furgoneta_van": {
        "BEV": 16,
        "PHEV": 31486,
        "HEV": 51946
      },
      "moto": {
        "BEV": 36866,
        "HEV": 349
      },
      "camion": {
        "BEV": 16516,
        "PHEV": 78,
        "HEV": 8361
      },
      "autobus": {
        "BEV": 2007,
        "PHEV": 2,
        "HEV": 18
      },
      "especial": {
        "BEV": 6948,
        "PHEV": 18,
        "HEV": 406
      },
      "otros": {
        "BEV": 2304,
        "PHEV": 265,
        "HEV": 5715
      }
    }
  },
  {
    "periodo": "2024-02",
    "matriculaciones_mes": {
      "BEV": 5258,
      "PHEV": 6027,
      "HEV": 29335,
      "REEV": 8,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 765,
      "PHEV": 696,
      "HEV": 4724,
      "REEV": 4
    },
    "parque_acumulado": {
      "BEV": 264758,
      "PHEV": 213256,
      "HEV": 1333271,
      "REEV": 2231,
      "FCEV": 58
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 176472,
        "PHEV": 180753,
        "HEV": 1265108
      },
      "suv_todo_terreno": {
        "BEV": 43,
        "HEV": 443
      },
      "furgoneta_van": {
        "BEV": 16,
        "PHEV": 32176,
        "HEV": 52719
      },
      "moto": {
        "BEV": 37060,
        "HEV": 364
      },
      "camion": {
        "BEV": 16817,
        "PHEV": 78,
        "HEV": 8462
      },
      "autobus": {
        "BEV": 2031,
        "PHEV": 2,
        "HEV": 18
      },
      "especial": {
        "BEV": 7049,
        "PHEV": 18,
        "HEV": 405
      },
      "otros": {
        "BEV": 2340,
        "PHEV": 272,
        "HEV": 5749
      }
    }
  },
  {
    "periodo": "2024-03",
    "matriculaciones_mes": {
      "BEV": 5786,
      "PHEV": 6037,
      "HEV": 34921,
      "REEV": 8
    },
    "bajas_mes": {
      "BEV": 805,
      "PHEV": 819,
      "HEV": 4358,
      "REEV": 4
    },
    "parque_acumulado": {
      "BEV": 269739,
      "PHEV": 218474,
      "HEV": 1363834,
      "REEV": 2235,
      "FCEV": 58
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 180512,
        "PHEV": 185267,
        "HEV": 1294712
      },
      "suv_todo_terreno": {
        "BEV": 43,
        "HEV": 443
      },
      "furgoneta_van": {
        "BEV": 16,
        "PHEV": 32850,
        "HEV": 53589
      },
      "moto": {
        "BEV": 37309,
        "HEV": 366
      },
      "camion": {
        "BEV": 17171,
        "PHEV": 78,
        "HEV": 8512
      },
      "autobus": {
        "BEV": 2057,
        "PHEV": 2,
        "HEV": 18
      },
      "especial": {
        "BEV": 7141,
        "PHEV": 18,
        "HEV": 405
      },
      "otros": {
        "BEV": 2378,
        "PHEV": 302,
        "HEV": 5786
      }
    }
  },
  {
    "periodo": "2024-04",
    "matriculaciones_mes": {
      "BEV": 5655,
      "PHEV": 5634,
      "HEV": 31501,
      "REEV": 13,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 1936,
      "PHEV": 838,
      "HEV": 4361,
      "REEV": 3
    },
    "parque_acumulado": {
      "BEV": 273458,
      "PHEV": 223270,
      "HEV": 1390974,
      "REEV": 2245,
      "FCEV": 59
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 184203,
        "PHEV": 189348,
        "HEV": 1320545
      },
      "suv_todo_terreno": {
        "BEV": 43,
        "HEV": 443
      },
      "furgoneta_van": {
        "BEV": 16,
        "PHEV": 33544,
        "HEV": 54626
      },
      "moto": {
        "BEV": 37639,
        "HEV": 367
      },
      "camion": {
        "BEV": 17453,
        "PHEV": 78,
        "HEV": 8732
      },
      "autobus": {
        "BEV": 2079,
        "PHEV": 2,
        "HEV": 19
      },
      "especial": {
        "BEV": 7243,
        "PHEV": 18,
        "HEV": 405
      },
      "otros": {
        "BEV": 2424,
        "PHEV": 325,
        "HEV": 5834
      }
    }
  },
  {
    "periodo": "2024-05",
    "matriculaciones_mes": {
      "BEV": 6209,
      "PHEV": 5389,
      "HEV": 34962,
      "REEV": 9,
      "FCEV": 13
    },
    "bajas_mes": {
      "BEV": 830,
      "PHEV": 768,
      "HEV": 3295,
      "REEV": 6
    },
    "parque_acumulado": {
      "BEV": 278837,
      "PHEV": 227891,
      "HEV": 1422641,
      "REEV": 2248,
      "FCEV": 72
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 188446,
        "PHEV": 193274,
        "HEV": 1351128
      },
      "suv_todo_terreno": {
        "BEV": 43,
        "HEV": 443
      },
      "furgoneta_van": {
        "BEV": 16,
        "PHEV": 34196,
        "HEV": 55548
      },
      "moto": {
        "BEV": 38117,
        "HEV": 380
      },
      "camion": {
        "BEV": 17703,
        "PHEV": 78,
        "HEV": 8816
      },
      "autobus": {
        "BEV": 2114,
        "PHEV": 2,
        "HEV": 19
      },
      "especial": {
        "BEV": 7371,
        "PHEV": 19,
        "HEV": 404
      },
      "otros": {
        "BEV": 2463,
        "PHEV": 367,
        "HEV": 5900
      }
    }
  },
  {
    "periodo": "2024-06",
    "matriculaciones_mes": {
      "BEV": 7137,
      "PHEV": 5928,
      "HEV": 38284,
      "REEV": 5,
      "FCEV": 7
    },
    "bajas_mes": {
      "BEV": 884,
      "PHEV": 1236,
      "HEV": 3056,
      "REEV": 4
    },
    "parque_acumulado": {
      "BEV": 285090,
      "PHEV": 232583,
      "HEV": 1457869,
      "REEV": 2249,
      "FCEV": 79
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 193856,
        "PHEV": 197206,
        "HEV": 1385124
      },
      "suv_todo_terreno": {
        "BEV": 55,
        "HEV": 443
      },
      "furgoneta_van": {
        "BEV": 16,
        "PHEV": 34871,
        "HEV": 56616
      },
      "moto": {
        "BEV": 38417,
        "HEV": 384
      },
      "camion": {
        "BEV": 17954,
        "PHEV": 78,
        "HEV": 8889
      },
      "autobus": {
        "BEV": 2138,
        "PHEV": 2,
        "HEV": 24
      },
      "especial": {
        "BEV": 7484,
        "PHEV": 20,
        "HEV": 416
      },
      "otros": {
        "BEV": 2504,
        "PHEV": 450,
        "HEV": 5970
      }
    }
  },
  {
    "periodo": "2024-07",
    "matriculaciones_mes": {
      "BEV": 6025,
      "PHEV": 5037,
      "HEV": 35412,
      "REEV": 13,
      "FCEV": 24
    },
    "bajas_mes": {
      "BEV": 1206,
      "PHEV": 1012,
      "HEV": 4096,
      "REEV": 4
    },
    "parque_acumulado": {
      "BEV": 289909,
      "PHEV": 236608,
      "HEV": 1489185,
      "REEV": 2258,
      "FCEV": 103
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 197329,
        "PHEV": 200500,
        "HEV": 1415305
      },
      "suv_todo_terreno": {
        "BEV": 55,
        "HEV": 443
      },
      "furgoneta_van": {
        "BEV": 17,
        "PHEV": 35593,
        "HEV": 57603
      },
      "moto": {
        "BEV": 39090,
        "HEV": 380
      },
      "camion": {
        "BEV": 18177,
        "PHEV": 81,
        "HEV": 8931
      },
      "autobus": {
        "BEV": 2177,
        "PHEV": 2,
        "HEV": 26
      },
      "especial": {
        "BEV": 7648,
        "PHEV": 20,
        "HEV": 437
      },
      "otros": {
        "BEV": 2601,
        "PHEV": 456,
        "HEV": 6057
      }
    }
  },
  {
    "periodo": "2024-08",
    "matriculaciones_mes": {
      "BEV": 4172,
      "PHEV": 3575,
      "HEV": 21923,
      "REEV": 9,
      "FCEV": 10
    },
    "bajas_mes": {
      "BEV": 510,
      "PHEV": 771,
      "HEV": 3593,
      "REEV": 8
    },
    "parque_acumulado": {
      "BEV": 293571,
      "PHEV": 239412,
      "HEV": 1507515,
      "REEV": 2259,
      "FCEV": 113
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 199968,
        "PHEV": 202946,
        "HEV": 1433039
      },
      "suv_todo_terreno": {
        "BEV": 55,
        "HEV": 448
      },
      "furgoneta_van": {
        "BEV": 17,
        "PHEV": 35937,
        "HEV": 58135
      },
      "moto": {
        "BEV": 39618,
        "HEV": 379
      },
      "camion": {
        "BEV": 18293,
        "PHEV": 89,
        "HEV": 8973
      },
      "autobus": {
        "BEV": 2199,
        "PHEV": 2,
        "HEV": 26
      },
      "especial": {
        "BEV": 7694,
        "PHEV": 20,
        "HEV": 442
      },
      "otros": {
        "BEV": 2631,
        "PHEV": 462,
        "HEV": 6070
      }
    }
  },
  {
    "periodo": "2024-09",
    "matriculaciones_mes": {
      "BEV": 7784,
      "PHEV": 4687,
      "HEV": 30704,
      "REEV": 12,
      "FCEV": 3
    },
    "bajas_mes": {
      "BEV": 730,
      "PHEV": 1212,
      "HEV": 5312,
      "REEV": 3
    },
    "parque_acumulado": {
      "BEV": 300625,
      "PHEV": 242887,
      "HEV": 1532907,
      "REEV": 2268,
      "FCEV": 116
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 206158,
        "PHEV": 206033,
        "HEV": 1457510
      },
      "suv_todo_terreno": {
        "BEV": 55,
        "HEV": 449
      },
      "furgoneta_van": {
        "BEV": 17,
        "PHEV": 36286,
        "HEV": 58951
      },
      "moto": {
        "BEV": 40041,
        "HEV": 382
      },
      "camion": {
        "BEV": 18413,
        "PHEV": 105,
        "HEV": 9023
      },
      "autobus": {
        "BEV": 2220,
        "PHEV": 3,
        "HEV": 26
      },
      "especial": {
        "BEV": 7780,
        "PHEV": 20,
        "HEV": 453
      },
      "otros": {
        "BEV": 2670,
        "PHEV": 484,
        "HEV": 6110
      }
    }
  },
  {
    "periodo": "2024-10",
    "matriculaciones_mes": {
      "BEV": 7064,
      "PHEV": 5985,
      "HEV": 36174,
      "REEV": 11,
      "FCEV": 4
    },
    "bajas_mes": {
      "BEV": 1043,
      "PHEV": 1533,
      "HEV": 6861,
      "REEV": 7
    },
    "parque_acumulado": {
      "BEV": 306646,
      "PHEV": 247339,
      "HEV": 1562220,
      "REEV": 2272,
      "FCEV": 120
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 210801,
        "PHEV": 209867,
        "HEV": 1485716
      },
      "suv_todo_terreno": {
        "BEV": 61,
        "HEV": 451
      },
      "furgoneta_van": {
        "BEV": 23,
        "PHEV": 36853,
        "HEV": 59929
      },
      "moto": {
        "BEV": 40878,
        "HEV": 379
      },
      "camion": {
        "BEV": 18668,
        "PHEV": 132,
        "HEV": 9085
      },
      "autobus": {
        "BEV": 2257,
        "PHEV": 3,
        "HEV": 26
      },
      "especial": {
        "BEV": 7883,
        "PHEV": 21,
        "HEV": 464
      },
      "otros": {
        "BEV": 2730,
        "PHEV": 507,
        "HEV": 6166
      }
    }
  },
  {
    "periodo": "2024-11",
    "matriculaciones_mes": {
      "BEV": 7584,
      "PHEV": 5545,
      "HEV": 35923,
      "REEV": 9
    },
    "bajas_mes": {
      "BEV": 1691,
      "PHEV": 1714,
      "HEV": 10949,
      "REEV": 17
    },
    "parque_acumulado": {
      "BEV": 312539,
      "PHEV": 251170,
      "HEV": 1587194,
      "REEV": 2264,
      "FCEV": 120
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 215832,
        "PHEV": 213118,
        "HEV": 1509713
      },
      "suv_todo_terreno": {
        "BEV": 61,
        "HEV": 450
      },
      "furgoneta_van": {
        "BEV": 32,
        "PHEV": 37411,
        "HEV": 60930
      },
      "moto": {
        "BEV": 41264,
        "HEV": 372
      },
      "camion": {
        "BEV": 18864,
        "PHEV": 162,
        "HEV": 9053
      },
      "autobus": {
        "BEV": 2279,
        "PHEV": 3,
        "HEV": 26
      },
      "especial": {
        "BEV": 7974,
        "PHEV": 22,
        "HEV": 472
      },
      "otros": {
        "BEV": 2750,
        "PHEV": 499,
        "HEV": 6174
      }
    }
  },
  {
    "periodo": "2024-12",
    "matriculaciones_mes": {
      "BEV": 11508,
      "PHEV": 7138,
      "HEV": 45964,
      "REEV": 6
    },
    "bajas_mes": {
      "BEV": 1358,
      "PHEV": 1114,
      "HEV": 9138,
      "REEV": 16
    },
    "parque_acumulado": {
      "BEV": 322689,
      "PHEV": 257194,
      "HEV": 1624020,
      "REEV": 2254,
      "FCEV": 120
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 224236,
        "PHEV": 218430,
        "HEV": 1545335
      },
      "suv_todo_terreno": {
        "BEV": 61,
        "HEV": 455
      },
      "furgoneta_van": {
        "BEV": 41,
        "PHEV": 37960,
        "HEV": 62081
      },
      "moto": {
        "BEV": 42012,
        "HEV": 367
      },
      "camion": {
        "BEV": 19177,
        "PHEV": 317,
        "HEV": 9078
      },
      "autobus": {
        "BEV": 2305,
        "PHEV": 3,
        "HEV": 26
      },
      "especial": {
        "BEV": 8059,
        "PHEV": 22,
        "HEV": 480
      },
      "otros": {
        "BEV": 2783,
        "PHEV": 508,
        "HEV": 6194
      }
    }
  },
  {
    "periodo": "2025-01",
    "matriculaciones_mes": {
      "BEV": 7200,
      "PHEV": 6230,
      "HEV": 33594,
      "REEV": 7
    },
    "bajas_mes": {
      "BEV": 1282,
      "PHEV": 1073,
      "HEV": 8083,
      "REEV": 6
    },
    "parque_acumulado": {
      "BEV": 328607,
      "PHEV": 262351,
      "HEV": 1649531,
      "REEV": 2255,
      "FCEV": 120
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 228967,
        "PHEV": 222885,
        "HEV": 1570236
      },
      "suv_todo_terreno": {
        "BEV": 61,
        "HEV": 457
      },
      "furgoneta_van": {
        "BEV": 49,
        "PHEV": 38574,
        "HEV": 62626
      },
      "moto": {
        "BEV": 42473,
        "HEV": 367
      },
      "camion": {
        "BEV": 19529,
        "PHEV": 374,
        "HEV": 9093
      },
      "autobus": {
        "BEV": 2345,
        "PHEV": 3,
        "HEV": 26
      },
      "especial": {
        "BEV": 8135,
        "PHEV": 25,
        "HEV": 489
      },
      "otros": {
        "BEV": 2818,
        "PHEV": 537,
        "HEV": 6233
      }
    }
  },
  {
    "periodo": "2025-02",
    "matriculaciones_mes": {
      "BEV": 8414,
      "PHEV": 7921,
      "HEV": 40803,
      "REEV": 11
    },
    "bajas_mes": {
      "BEV": 1536,
      "PHEV": 1071,
      "HEV": 7867,
      "REEV": 16
    },
    "parque_acumulado": {
      "BEV": 335485,
      "PHEV": 269201,
      "HEV": 1682467,
      "REEV": 2250,
      "FCEV": 120
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 234802,
        "PHEV": 229029,
        "HEV": 1602609
      },
      "suv_todo_terreno": {
        "BEV": 62,
        "HEV": 476
      },
      "furgoneta_van": {
        "BEV": 53,
        "PHEV": 39170,
        "HEV": 63149
      },
      "moto": {
        "BEV": 42702,
        "HEV": 365
      },
      "camion": {
        "BEV": 19815,
        "PHEV": 462,
        "HEV": 9075
      },
      "autobus": {
        "BEV": 2367,
        "PHEV": 3,
        "HEV": 26
      },
      "especial": {
        "BEV": 8291,
        "PHEV": 27,
        "HEV": 500
      },
      "otros": {
        "BEV": 2841,
        "PHEV": 558,
        "HEV": 6263
      }
    }
  },
  {
    "periodo": "2025-03",
    "matriculaciones_mes": {
      "BEV": 10369,
      "PHEV": 9412,
      "HEV": 50082,
      "REEV": 11
    },
    "bajas_mes": {
      "BEV": 1981,
      "PHEV": 1306,
      "HEV": 7956,
      "REEV": 11
    },
    "parque_acumulado": {
      "BEV": 343873,
      "PHEV": 277307,
      "HEV": 1724593,
      "REEV": 2250,
      "FCEV": 120
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 242763,
        "PHEV": 236259,
        "HEV": 1643625
      },
      "suv_todo_terreno": {
        "BEV": 62,
        "HEV": 480
      },
      "furgoneta_van": {
        "BEV": 59,
        "PHEV": 39929,
        "HEV": 64193
      },
      "moto": {
        "BEV": 42267,
        "HEV": 364
      },
      "camion": {
        "BEV": 20331,
        "PHEV": 526,
        "HEV": 9136
      },
      "autobus": {
        "BEV": 2399,
        "PHEV": 3,
        "HEV": 26
      },
      "especial": {
        "BEV": 8461,
        "PHEV": 27,
        "HEV": 513
      },
      "otros": {
        "BEV": 2892,
        "PHEV": 611,
        "HEV": 6252
      }
    }
  },
  {
    "periodo": "2025-04",
    "matriculaciones_mes": {
      "BEV": 9390,
      "PHEV": 10500,
      "HEV": 41707,
      "REEV": 9
    },
    "bajas_mes": {
      "BEV": 3033,
      "PHEV": 1091,
      "HEV": 6344,
      "REEV": 8
    },
    "parque_acumulado": {
      "BEV": 350230,
      "PHEV": 286716,
      "HEV": 1759956,
      "REEV": 2251,
      "FCEV": 120
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 249742,
        "PHEV": 244665,
        "HEV": 1677969
      },
      "suv_todo_terreno": {
        "BEV": 62,
        "HEV": 487
      },
      "furgoneta_van": {
        "BEV": 62,
        "PHEV": 40603,
        "HEV": 65156
      },
      "moto": {
        "BEV": 41077,
        "HEV": 368
      },
      "camion": {
        "BEV": 20564,
        "PHEV": 755,
        "HEV": 9142
      },
      "autobus": {
        "BEV": 2424,
        "PHEV": 3,
        "HEV": 26
      },
      "especial": {
        "BEV": 8550,
        "PHEV": 29,
        "HEV": 518
      },
      "otros": {
        "BEV": 2943,
        "PHEV": 711,
        "HEV": 6286
      }
    }
  },
  {
    "periodo": "2025-05",
    "matriculaciones_mes": {
      "BEV": 11415,
      "PHEV": 14460,
      "HEV": 45973,
      "REEV": 6
    },
    "bajas_mes": {
      "BEV": 1952,
      "PHEV": 1119,
      "HEV": 6664,
      "REEV": 5
    },
    "parque_acumulado": {
      "BEV": 359693,
      "PHEV": 300057,
      "HEV": 1799265,
      "REEV": 2252,
      "FCEV": 120
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 258613,
        "PHEV": 256990,
        "HEV": 1716414
      },
      "suv_todo_terreno": {
        "BEV": 62,
        "HEV": 492
      },
      "furgoneta_van": {
        "BEV": 67,
        "PHEV": 41179,
        "HEV": 65987
      },
      "moto": {
        "BEV": 40969,
        "HEV": 365
      },
      "camion": {
        "BEV": 20859,
        "PHEV": 1019,
        "HEV": 9148
      },
      "autobus": {
        "BEV": 2445,
        "PHEV": 3,
        "HEV": 26
      },
      "especial": {
        "BEV": 8646,
        "PHEV": 28,
        "HEV": 533
      },
      "otros": {
        "BEV": 2998,
        "PHEV": 888,
        "HEV": 6296
      }
    }
  },
  {
    "periodo": "2025-06",
    "matriculaciones_mes": {
      "BEV": 14429,
      "PHEV": 15112,
      "HEV": 47757,
      "REEV": 6,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 1625,
      "PHEV": 1073,
      "HEV": 7221,
      "REEV": 5,
      "FCEV": 1
    },
    "parque_acumulado": {
      "BEV": 372497,
      "PHEV": 314096,
      "HEV": 1839801,
      "REEV": 2253,
      "FCEV": 120
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 269794,
        "PHEV": 269925,
        "HEV": 1756086
      },
      "suv_todo_terreno": {
        "BEV": 63,
        "HEV": 495
      },
      "furgoneta_van": {
        "BEV": 73,
        "PHEV": 41883,
        "HEV": 66784
      },
      "moto": {
        "BEV": 41119,
        "HEV": 367
      },
      "camion": {
        "BEV": 21864,
        "PHEV": 1209,
        "HEV": 9155
      },
      "autobus": {
        "BEV": 2482,
        "PHEV": 3,
        "HEV": 26
      },
      "especial": {
        "BEV": 8774,
        "PHEV": 30,
        "HEV": 541
      },
      "otros": {
        "BEV": 3103,
        "PHEV": 1097,
        "HEV": 6343
      }
    }
  },
  {
    "periodo": "2025-07",
    "matriculaciones_mes": {
      "BEV": 11723,
      "PHEV": 13749,
      "HEV": 41392,
      "REEV": 3
    },
    "bajas_mes": {
      "BEV": 1383,
      "PHEV": 1185,
      "HEV": 7195,
      "REEV": 3
    },
    "parque_acumulado": {
      "BEV": 382837,
      "PHEV": 326660,
      "HEV": 1873998,
      "REEV": 2253,
      "FCEV": 120
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 278379,
        "PHEV": 281356,
        "HEV": 1789356
      },
      "suv_todo_terreno": {
        "BEV": 71,
        "HEV": 503
      },
      "furgoneta_van": {
        "BEV": 76,
        "PHEV": 42718,
        "HEV": 67682
      },
      "moto": {
        "BEV": 41636,
        "HEV": 368
      },
      "camion": {
        "BEV": 22453,
        "PHEV": 1351,
        "HEV": 9152
      },
      "autobus": {
        "BEV": 2516,
        "PHEV": 3,
        "HEV": 26
      },
      "especial": {
        "BEV": 8909,
        "PHEV": 31,
        "HEV": 546
      },
      "otros": {
        "BEV": 3276,
        "PHEV": 1252,
        "HEV": 6361
      }
    }
  },
  {
    "periodo": "2025-08",
    "matriculaciones_mes": {
      "BEV": 8775,
      "PHEV": 9063,
      "HEV": 26651,
      "REEV": 11
    },
    "bajas_mes": {
      "BEV": 943,
      "PHEV": 913,
      "HEV": 5353,
      "REEV": 4
    },
    "parque_acumulado": {
      "BEV": 390669,
      "PHEV": 334810,
      "HEV": 1895296,
      "REEV": 2260,
      "FCEV": 120
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 285178,
        "PHEV": 288786,
        "HEV": 1810126
      },
      "suv_todo_terreno": {
        "BEV": 72,
        "HEV": 502
      },
      "furgoneta_van": {
        "BEV": 78,
        "PHEV": 43237,
        "HEV": 68140
      },
      "moto": {
        "BEV": 42078,
        "HEV": 369
      },
      "camion": {
        "BEV": 22746,
        "PHEV": 1455,
        "HEV": 9177
      },
      "autobus": {
        "BEV": 2535,
        "PHEV": 3,
        "HEV": 27
      },
      "especial": {
        "BEV": 9017,
        "PHEV": 32,
        "HEV": 549
      },
      "otros": {
        "BEV": 3360,
        "PHEV": 1348,
        "HEV": 6402
      }
    }
  },
  {
    "periodo": "2025-09",
    "matriculaciones_mes": {
      "BEV": 12340,
      "PHEV": 11638,
      "HEV": 36529,
      "REEV": 111,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 1594,
      "PHEV": 1615,
      "HEV": 8074,
      "REEV": 5
    },
    "parque_acumulado": {
      "BEV": 401415,
      "PHEV": 344833,
      "HEV": 1923751,
      "REEV": 2366,
      "FCEV": 121
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 294820,
        "PHEV": 297930,
        "HEV": 1837908
      },
      "suv_todo_terreno": {
        "BEV": 83,
        "HEV": 504
      },
      "furgoneta_van": {
        "BEV": 82,
        "PHEV": 43780,
        "HEV": 68746
      },
      "moto": {
        "BEV": 42390,
        "HEV": 367
      },
      "camion": {
        "BEV": 23194,
        "PHEV": 1622,
        "HEV": 9185
      },
      "autobus": {
        "BEV": 2545,
        "PHEV": 3,
        "HEV": 27
      },
      "especial": {
        "BEV": 9110,
        "PHEV": 33,
        "HEV": 552
      },
      "otros": {
        "BEV": 3458,
        "PHEV": 1516,
        "HEV": 6458
      }
    }
  },
  {
    "periodo": "2025-10",
    "matriculaciones_mes": {
      "BEV": 12004,
      "PHEV": 14479,
      "HEV": 43411,
      "REEV": 136,
      "FCEV": 2
    },
    "bajas_mes": {
      "BEV": 2001,
      "PHEV": 1685,
      "HEV": 10563,
      "REEV": 10,
      "FCEV": 1
    },
    "parque_acumulado": {
      "BEV": 411418,
      "PHEV": 357627,
      "HEV": 1956599,
      "REEV": 2492,
      "FCEV": 122
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 303307,
        "PHEV": 309621,
        "HEV": 1870032
      },
      "suv_todo_terreno": {
        "BEV": 90,
        "HEV": 516
      },
      "furgoneta_van": {
        "BEV": 88,
        "PHEV": 44420,
        "HEV": 69332
      },
      "moto": {
        "BEV": 42971,
        "HEV": 367
      },
      "camion": {
        "BEV": 23584,
        "PHEV": 1852,
        "HEV": 9240
      },
      "autobus": {
        "BEV": 2604,
        "PHEV": 3,
        "HEV": 27
      },
      "especial": {
        "BEV": 9249,
        "PHEV": 35,
        "HEV": 571
      },
      "otros": {
        "BEV": 3520,
        "PHEV": 1747,
        "HEV": 6510
      }
    }
  },
  {
    "periodo": "2025-11",
    "matriculaciones_mes": {
      "BEV": 12526,
      "PHEV": 13505,
      "HEV": 42306,
      "REEV": 142,
      "FCEV": 18
    },
    "bajas_mes": {
      "BEV": 1810,
      "PHEV": 1937,
      "HEV": 11294,
      "REEV": 10,
      "FCEV": 4
    },
    "parque_acumulado": {
      "BEV": 422134,
      "PHEV": 369195,
      "HEV": 1987611,
      "REEV": 2624,
      "FCEV": 136
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 312119,
        "PHEV": 320240,
        "HEV": 1900243
      },
      "suv_todo_terreno": {
        "BEV": 98,
        "HEV": 526
      },
      "furgoneta_van": {
        "BEV": 90,
        "PHEV": 45035,
        "HEV": 70041
      },
      "moto": {
        "BEV": 43159,
        "HEV": 359
      },
      "camion": {
        "BEV": 24111,
        "PHEV": 2038,
        "HEV": 9240
      },
      "autobus": {
        "BEV": 2645,
        "PHEV": 3,
        "HEV": 27
      },
      "especial": {
        "BEV": 9397,
        "PHEV": 36,
        "HEV": 576
      },
      "otros": {
        "BEV": 3721,
        "PHEV": 1893,
        "HEV": 6595
      }
    }
  },
  {
    "periodo": "2025-12",
    "matriculaciones_mes": {
      "BEV": 13808,
      "PHEV": 14336,
      "HEV": 46643,
      "REEV": 109,
      "FCEV": 2
    },
    "bajas_mes": {
      "BEV": 3499,
      "PHEV": 2264,
      "HEV": 13363,
      "REEV": 10
    },
    "parque_acumulado": {
      "BEV": 432443,
      "PHEV": 381267,
      "HEV": 2020891,
      "REEV": 2723,
      "FCEV": 138
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 321937,
        "PHEV": 331220,
        "HEV": 1932896
      },
      "suv_todo_terreno": {
        "BEV": 102,
        "HEV": 531
      },
      "furgoneta_van": {
        "BEV": 101,
        "PHEV": 45636,
        "HEV": 70622
      },
      "moto": {
        "BEV": 42719,
        "HEV": 355
      },
      "camion": {
        "BEV": 24515,
        "PHEV": 2277,
        "HEV": 9229
      },
      "autobus": {
        "BEV": 2688,
        "PHEV": 3,
        "HEV": 27
      },
      "especial": {
        "BEV": 9546,
        "PHEV": 36,
        "HEV": 582
      },
      "otros": {
        "BEV": 3866,
        "PHEV": 2145,
        "HEV": 6645
      }
    }
  },
  {
    "periodo": "2026-01",
    "matriculaciones_mes": {
      "BEV": 8213,
      "PHEV": 10016,
      "HEV": 36630,
      "REEV": 68
    },
    "bajas_mes": {
      "BEV": 1661,
      "PHEV": 2298,
      "HEV": 6867,
      "REEV": 15
    },
    "parque_acumulado": {
      "BEV": 438995,
      "PHEV": 388985,
      "HEV": 2050654,
      "REEV": 2776,
      "FCEV": 138
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 327969,
        "PHEV": 338142,
        "HEV": 1962125
      },
      "suv_todo_terreno": {
        "BEV": 104,
        "HEV": 531
      },
      "furgoneta_van": {
        "BEV": 102,
        "PHEV": 46227,
        "HEV": 71116
      },
      "moto": {
        "BEV": 42495,
        "HEV": 355
      },
      "camion": {
        "BEV": 24880,
        "PHEV": 2408,
        "HEV": 9231
      },
      "autobus": {
        "BEV": 2734,
        "PHEV": 3,
        "HEV": 27
      },
      "especial": {
        "BEV": 9627,
        "PHEV": 38,
        "HEV": 588
      },
      "otros": {
        "BEV": 4002,
        "PHEV": 2216,
        "HEV": 6677
      }
    }
  },
  {
    "periodo": "2026-02",
    "matriculaciones_mes": {
      "BEV": 11465,
      "PHEV": 13611,
      "HEV": 47929,
      "REEV": 74,
      "FCEV": 1
    },
    "bajas_mes": {
      "BEV": 3289,
      "PHEV": 1668,
      "HEV": 7788,
      "REEV": 7
    },
    "parque_acumulado": {
      "BEV": 447171,
      "PHEV": 400928,
      "HEV": 2090795,
      "REEV": 2843,
      "FCEV": 139
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 336195,
        "PHEV": 349053,
        "HEV": 2001718
      },
      "suv_todo_terreno": {
        "BEV": 104,
        "HEV": 532
      },
      "furgoneta_van": {
        "BEV": 104,
        "PHEV": 46930,
        "HEV": 71571
      },
      "moto": {
        "BEV": 41275,
        "HEV": 356
      },
      "camion": {
        "BEV": 25480,
        "PHEV": 2536,
        "HEV": 9252
      },
      "autobus": {
        "BEV": 2795,
        "PHEV": 3,
        "HEV": 27
      },
      "especial": {
        "BEV": 9846,
        "PHEV": 40,
        "HEV": 592
      },
      "otros": {
        "BEV": 4105,
        "PHEV": 2413,
        "HEV": 6743
      }
    }
  }
];
