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
    "parque_activo": 406002,
    "tasa_baja_pct": 16.79
  },
  "PHEV": {
    "matriculadas": 431582,
    "bajas": 49732,
    "parque_activo": 381850,
    "tasa_baja_pct": 11.52
  },
  "HEV": {
    "matriculadas": 2191084,
    "bajas": 303014,
    "parque_activo": 1888070,
    "tasa_baja_pct": 13.83
  },
  "REEV": {
    "matriculadas": 2740,
    "bajas": 757,
    "parque_activo": 1983,
    "tasa_baja_pct": 27.63
  },
  "FCEV": {
    "matriculadas": 144,
    "bajas": 8,
    "parque_activo": 136,
    "tasa_baja_pct": 5.56
  }
};

export const dgtParqueResumenPorTipo: Record<string, Record<string, { matriculadas: number; bajas: number; parque_activo: number }>> = {
  "turismo": {
    "BEV": {
      "matriculadas": 346865,
      "bajas": 41977,
      "parque_activo": 304888
    },
    "PHEV": {
      "matriculadas": 375197,
      "bajas": 42397,
      "parque_activo": 332800
    },
    "HEV": {
      "matriculadas": 2099443,
      "bajas": 290933,
      "parque_activo": 1808510
    }
  },
  "suv_todo_terreno": {
    "BEV": {
      "matriculadas": 98,
      "bajas": 2,
      "parque_activo": 96
    },
    "HEV": {
      "matriculadas": 480,
      "bajas": 4,
      "parque_activo": 476
    }
  },
  "furgoneta_van": {
    "BEV": {
      "matriculadas": 102,
      "bajas": 6,
      "parque_activo": 96
    },
    "PHEV": {
      "matriculadas": 51062,
      "bajas": 6879,
      "parque_activo": 44183
    },
    "HEV": {
      "matriculadas": 74389,
      "bajas": 10364,
      "parque_activo": 64025
    }
  },
  "moto": {
    "BEV": {
      "matriculadas": 60194,
      "bajas": 24370,
      "parque_activo": 35824
    },
    "PHEV": {
      "matriculadas": 13,
      "bajas": 43,
      "parque_activo": -30
    },
    "HEV": {
      "matriculadas": 429,
      "bajas": 116,
      "parque_activo": 313
    }
  },
  "camion": {
    "BEV": {
      "matriculadas": 26100,
      "bajas": 3242,
      "parque_activo": 22858
    },
    "PHEV": {
      "matriculadas": 2532,
      "bajas": 32,
      "parque_activo": 2500
    },
    "HEV": {
      "matriculadas": 9062,
      "bajas": 884,
      "parque_activo": 8178
    }
  },
  "autobus": {
    "BEV": {
      "matriculadas": 2486,
      "bajas": 0,
      "parque_activo": 2486
    },
    "PHEV": {
      "matriculadas": 3,
      "bajas": 0,
      "parque_activo": 3
    },
    "HEV": {
      "matriculadas": 24,
      "bajas": 0,
      "parque_activo": 24
    }
  },
  "especial": {
    "BEV": {
      "matriculadas": 8770,
      "bajas": 15,
      "parque_activo": 8755
    },
    "PHEV": {
      "matriculadas": 49,
      "bajas": 11,
      "parque_activo": 38
    },
    "HEV": {
      "matriculadas": 624,
      "bajas": 92,
      "parque_activo": 532
    }
  },
  "otros": {
    "BEV": {
      "matriculadas": 5720,
      "bajas": 1988,
      "parque_activo": 3732
    },
    "PHEV": {
      "matriculadas": 2717,
      "bajas": 346,
      "parque_activo": 2371
    },
    "HEV": {
      "matriculadas": 6626,
      "bajas": 618,
      "parque_activo": 6008
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
      "BEV": 187,
      "PHEV": 38,
      "HEV": 387,
      "REEV": 15
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 121,
        "PHEV": 33,
        "HEV": 388
      },
      "furgoneta_van": {
        "PHEV": 6
      },
      "moto": {
        "BEV": 6
      },
      "camion": {
        "BEV": 57
      },
      "autobus": {
        "BEV": 2
      },
      "otros": {
        "BEV": 1
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
      "BEV": 265,
      "PHEV": 30,
      "HEV": 847,
      "REEV": 19
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 164,
        "PHEV": 21,
        "HEV": 840
      },
      "furgoneta_van": {
        "PHEV": 8,
        "HEV": 3
      },
      "moto": {
        "BEV": 19
      },
      "camion": {
        "BEV": 64,
        "HEV": 1
      },
      "autobus": {
        "BEV": 3
      },
      "especial": {
        "HEV": 3
      },
      "otros": {
        "BEV": 1
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
      "BEV": 358,
      "PHEV": 35,
      "HEV": 1163,
      "REEV": 24
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 180,
        "PHEV": 22,
        "HEV": 1152
      },
      "furgoneta_van": {
        "PHEV": 12,
        "HEV": 6
      },
      "moto": {
        "BEV": 80
      },
      "camion": {
        "BEV": 71,
        "HEV": 1
      },
      "autobus": {
        "BEV": 6
      },
      "especial": {
        "HEV": 4
      },
      "otros": {
        "BEV": 1
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
      "BEV": 528,
      "PHEV": 55,
      "HEV": 1604,
      "REEV": 26
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 299,
        "PHEV": 38,
        "HEV": 1592
      },
      "furgoneta_van": {
        "PHEV": 14,
        "HEV": 6
      },
      "moto": {
        "BEV": 88
      },
      "camion": {
        "BEV": 88,
        "PHEV": 2,
        "HEV": 1
      },
      "autobus": {
        "BEV": 7
      },
      "especial": {
        "HEV": 5
      },
      "otros": {
        "BEV": 4
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
      "BEV": 619,
      "PHEV": 91,
      "HEV": 1963,
      "REEV": 32
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 344,
        "PHEV": 70,
        "HEV": 1955
      },
      "furgoneta_van": {
        "PHEV": 18,
        "HEV": 3
      },
      "moto": {
        "BEV": 98
      },
      "camion": {
        "BEV": 116,
        "PHEV": 2,
        "HEV": 0
      },
      "autobus": {
        "BEV": 11
      },
      "especial": {
        "HEV": 5
      },
      "otros": {
        "BEV": 3
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
      "BEV": 694,
      "PHEV": 138,
      "HEV": 2356,
      "REEV": 45
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 385,
        "PHEV": 112,
        "HEV": 2345
      },
      "furgoneta_van": {
        "PHEV": 23,
        "HEV": 4
      },
      "moto": {
        "BEV": 121,
        "HEV": 1
      },
      "camion": {
        "BEV": 124,
        "PHEV": 3,
        "HEV": 0
      },
      "autobus": {
        "BEV": 16
      },
      "especial": {
        "HEV": 6
      },
      "otros": {
        "BEV": 3
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
      "BEV": 818,
      "PHEV": 171,
      "HEV": 2930,
      "REEV": 58
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 441,
        "PHEV": 142,
        "HEV": 2919
      },
      "furgoneta_van": {
        "PHEV": 28,
        "HEV": 4
      },
      "moto": {
        "BEV": 154,
        "HEV": 1
      },
      "camion": {
        "BEV": 140,
        "PHEV": 3,
        "HEV": 0
      },
      "autobus": {
        "BEV": 17
      },
      "especial": {
        "HEV": 6
      },
      "otros": {
        "BEV": 4
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
      "BEV": 1017,
      "PHEV": 256,
      "HEV": 3795,
      "REEV": 61
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 519,
        "PHEV": 219,
        "HEV": 3778
      },
      "furgoneta_van": {
        "PHEV": 37,
        "HEV": 9
      },
      "moto": {
        "BEV": 161,
        "HEV": 1
      },
      "camion": {
        "BEV": 181,
        "PHEV": 3,
        "HEV": 1
      },
      "autobus": {
        "BEV": 33
      },
      "especial": {
        "HEV": 6
      },
      "otros": {
        "BEV": 33
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
      "BEV": 1103,
      "PHEV": 291,
      "HEV": 4380,
      "REEV": 61
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 575,
        "PHEV": 253,
        "HEV": 4360
      },
      "furgoneta_van": {
        "PHEV": 39,
        "HEV": 11
      },
      "moto": {
        "BEV": 158,
        "HEV": 1
      },
      "camion": {
        "BEV": 193,
        "PHEV": 3,
        "HEV": 1
      },
      "autobus": {
        "BEV": 36
      },
      "especial": {
        "HEV": 6
      },
      "otros": {
        "BEV": 40,
        "HEV": 1
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
      "BEV": 1196,
      "PHEV": 373,
      "HEV": 5065,
      "REEV": 60
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 632,
        "PHEV": 328,
        "HEV": 5043
      },
      "furgoneta_van": {
        "PHEV": 45,
        "HEV": 12
      },
      "moto": {
        "BEV": 152,
        "PHEV": -4,
        "HEV": 1
      },
      "camion": {
        "BEV": 209,
        "PHEV": 3,
        "HEV": 1
      },
      "autobus": {
        "BEV": 42
      },
      "especial": {
        "HEV": 7
      },
      "otros": {
        "BEV": 47,
        "HEV": 1
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
      "BEV": 1534,
      "PHEV": 447,
      "HEV": 5488,
      "REEV": 60
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 919,
        "PHEV": 395,
        "HEV": 5460
      },
      "furgoneta_van": {
        "PHEV": 53,
        "HEV": 16
      },
      "moto": {
        "BEV": 146,
        "PHEV": -5,
        "HEV": 1
      },
      "camion": {
        "BEV": 232,
        "PHEV": 3,
        "HEV": 1
      },
      "autobus": {
        "BEV": 53
      },
      "especial": {
        "HEV": 8
      },
      "otros": {
        "BEV": 48,
        "HEV": 2
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
      "BEV": 1758,
      "PHEV": 481,
      "HEV": 5468,
      "REEV": 60
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 1103,
        "PHEV": 423,
        "HEV": 5438
      },
      "furgoneta_van": {
        "PHEV": 59,
        "HEV": 18
      },
      "moto": {
        "BEV": 158,
        "PHEV": -5,
        "HEV": 1
      },
      "camion": {
        "BEV": 240,
        "PHEV": 3,
        "HEV": 1
      },
      "autobus": {
        "BEV": 56
      },
      "especial": {
        "HEV": 8
      },
      "otros": {
        "BEV": 58,
        "HEV": 2
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
      "BEV": 1830,
      "PHEV": 513,
      "HEV": 6761,
      "REEV": 63
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 1112,
        "PHEV": 453,
        "HEV": 6707
      },
      "suv_todo_terreno": {
        "HEV": 15
      },
      "furgoneta_van": {
        "PHEV": 62,
        "HEV": 25
      },
      "moto": {
        "BEV": 141,
        "PHEV": -6,
        "HEV": 1
      },
      "camion": {
        "BEV": 291,
        "PHEV": 3,
        "HEV": 1
      },
      "autobus": {
        "BEV": 56
      },
      "especial": {
        "HEV": 9
      },
      "otros": {
        "BEV": 75,
        "HEV": 2
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
      "BEV": 2010,
      "PHEV": 583,
      "HEV": 8746,
      "REEV": 77
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 1206,
        "PHEV": 497,
        "HEV": 8686
      },
      "suv_todo_terreno": {
        "HEV": 15
      },
      "furgoneta_van": {
        "PHEV": 88,
        "HEV": 27
      },
      "moto": {
        "BEV": 174,
        "PHEV": -6,
        "HEV": 1
      },
      "camion": {
        "BEV": 302,
        "PHEV": 3,
        "HEV": 1
      },
      "autobus": {
        "BEV": 57
      },
      "especial": {
        "BEV": 17,
        "HEV": 13
      },
      "otros": {
        "BEV": 85,
        "HEV": 2
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
      "BEV": 2152,
      "PHEV": 651,
      "HEV": 10702,
      "REEV": 87
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 1240,
        "PHEV": 550,
        "HEV": 10634
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 15
      },
      "furgoneta_van": {
        "PHEV": 105,
        "HEV": 30
      },
      "moto": {
        "BEV": 168,
        "PHEV": -7,
        "HEV": 1
      },
      "camion": {
        "BEV": 318,
        "PHEV": 3,
        "HEV": 2
      },
      "autobus": {
        "BEV": 58
      },
      "especial": {
        "BEV": 52,
        "HEV": 16
      },
      "otros": {
        "BEV": 91,
        "HEV": 3
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
      "BEV": 2515,
      "PHEV": 836,
      "HEV": 12671,
      "REEV": 105
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 1437,
        "PHEV": 705,
        "HEV": 12595
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 15
      },
      "furgoneta_van": {
        "PHEV": 135,
        "HEV": 35
      },
      "moto": {
        "BEV": 180,
        "PHEV": -7,
        "HEV": 1
      },
      "camion": {
        "BEV": 363,
        "PHEV": 3,
        "HEV": 2
      },
      "autobus": {
        "BEV": 69
      },
      "especial": {
        "BEV": 83,
        "HEV": 19
      },
      "otros": {
        "BEV": 98,
        "HEV": 3
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
      "BEV": 2755,
      "PHEV": 1036,
      "HEV": 14592,
      "REEV": 111
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 1579,
        "PHEV": 888,
        "HEV": 14513
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 15
      },
      "furgoneta_van": {
        "PHEV": 154,
        "HEV": 37
      },
      "moto": {
        "BEV": 180,
        "PHEV": -9,
        "HEV": 1
      },
      "camion": {
        "BEV": 406,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 72
      },
      "especial": {
        "BEV": 113,
        "HEV": 19
      },
      "otros": {
        "BEV": 99,
        "HEV": 3
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
      "BEV": 3119,
      "PHEV": 1185,
      "HEV": 17089,
      "REEV": 143
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 1722,
        "PHEV": 986,
        "HEV": 17006
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 15
      },
      "furgoneta_van": {
        "PHEV": 206,
        "HEV": 42
      },
      "moto": {
        "BEV": 181,
        "PHEV": -9,
        "HEV": 1
      },
      "camion": {
        "BEV": 483,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 77
      },
      "especial": {
        "BEV": 144,
        "HEV": 18
      },
      "otros": {
        "BEV": 107,
        "HEV": 3
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
      "BEV": 3263,
      "PHEV": 1307,
      "HEV": 19618,
      "REEV": 160
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 1777,
        "PHEV": 1047,
        "HEV": 19525
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 15
      },
      "furgoneta_van": {
        "PHEV": 267,
        "HEV": 48
      },
      "moto": {
        "BEV": 158,
        "PHEV": -9,
        "HEV": 2
      },
      "camion": {
        "BEV": 531,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 82
      },
      "especial": {
        "BEV": 178,
        "HEV": 21
      },
      "otros": {
        "BEV": 122,
        "HEV": 3
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
      "BEV": 3536,
      "PHEV": 1412,
      "HEV": 22393,
      "REEV": 175
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 1909,
        "PHEV": 1115,
        "HEV": 22290
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 15
      },
      "furgoneta_van": {
        "PHEV": 304,
        "HEV": 53
      },
      "moto": {
        "BEV": 170,
        "PHEV": -9,
        "HEV": 5
      },
      "camion": {
        "BEV": 587,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 89
      },
      "especial": {
        "BEV": 198,
        "HEV": 22
      },
      "otros": {
        "BEV": 137,
        "HEV": 4
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
      "BEV": 3639,
      "PHEV": 1492,
      "HEV": 24573,
      "REEV": 180
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 1970,
        "PHEV": 1176,
        "HEV": 24469
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 15
      },
      "furgoneta_van": {
        "PHEV": 323,
        "HEV": 55
      },
      "moto": {
        "BEV": 161,
        "PHEV": -9,
        "HEV": 4
      },
      "camion": {
        "BEV": 616,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 89
      },
      "especial": {
        "BEV": 213,
        "HEV": 22
      },
      "otros": {
        "BEV": 145,
        "HEV": 4
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
      "BEV": 3909,
      "PHEV": 1622,
      "HEV": 26797,
      "REEV": 186
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 2075,
        "PHEV": 1276,
        "HEV": 26686
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 15
      },
      "furgoneta_van": {
        "PHEV": 352,
        "HEV": 59
      },
      "moto": {
        "BEV": 188,
        "PHEV": -9,
        "HEV": 5
      },
      "camion": {
        "BEV": 668,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 89
      },
      "especial": {
        "BEV": 250,
        "PHEV": 1,
        "HEV": 23
      },
      "otros": {
        "BEV": 160,
        "HEV": 5
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
      "BEV": 4156,
      "PHEV": 1702,
      "HEV": 29374,
      "REEV": 193
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 2155,
        "PHEV": 1343,
        "HEV": 29259
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 15
      },
      "furgoneta_van": {
        "PHEV": 366,
        "HEV": 62
      },
      "moto": {
        "BEV": 178,
        "PHEV": -10,
        "HEV": 5
      },
      "camion": {
        "BEV": 764,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 90
      },
      "especial": {
        "BEV": 294,
        "PHEV": 1,
        "HEV": 23
      },
      "otros": {
        "BEV": 167,
        "HEV": 5
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
      "BEV": 4616,
      "PHEV": 1811,
      "HEV": 32341,
      "REEV": 191
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 2520,
        "PHEV": 1416,
        "HEV": 32224
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 15
      },
      "furgoneta_van": {
        "PHEV": 403,
        "HEV": 64
      },
      "moto": {
        "BEV": 181,
        "PHEV": -11,
        "HEV": 3
      },
      "camion": {
        "BEV": 794,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 94
      },
      "especial": {
        "BEV": 325,
        "PHEV": 1,
        "HEV": 25
      },
      "otros": {
        "BEV": 167,
        "HEV": 6
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
      "BEV": 5121,
      "PHEV": 1891,
      "HEV": 35244,
      "REEV": 201
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 2849,
        "PHEV": 1463,
        "HEV": 35083
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 48
      },
      "furgoneta_van": {
        "PHEV": 437,
        "HEV": 72
      },
      "moto": {
        "BEV": 208,
        "PHEV": -11,
        "HEV": 3
      },
      "camion": {
        "BEV": 850,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 94
      },
      "especial": {
        "BEV": 380,
        "PHEV": 1,
        "HEV": 27
      },
      "otros": {
        "BEV": 171,
        "HEV": 7
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
      "BEV": 5353,
      "PHEV": 2008,
      "HEV": 39342,
      "REEV": 214
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 2927,
        "PHEV": 1556,
        "HEV": 39166
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 55
      },
      "furgoneta_van": {
        "PHEV": 461,
        "HEV": 76
      },
      "moto": {
        "BEV": 224,
        "PHEV": -11,
        "HEV": 4
      },
      "camion": {
        "BEV": 878,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 95
      },
      "especial": {
        "BEV": 421,
        "PHEV": 1,
        "HEV": 30
      },
      "otros": {
        "BEV": 168,
        "HEV": 7
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
      "BEV": 5654,
      "PHEV": 2102,
      "HEV": 43099,
      "REEV": 230
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 3104,
        "PHEV": 1632,
        "HEV": 42911
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 55
      },
      "furgoneta_van": {
        "PHEV": 480,
        "HEV": 80
      },
      "moto": {
        "BEV": 245,
        "PHEV": -11,
        "HEV": 8
      },
      "camion": {
        "BEV": 909,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 95
      },
      "especial": {
        "BEV": 465,
        "PHEV": 1,
        "HEV": 31
      },
      "otros": {
        "BEV": 173,
        "HEV": 10
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
      "BEV": 6034,
      "PHEV": 2254,
      "HEV": 47376,
      "REEV": 264
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 3381,
        "PHEV": 1757,
        "HEV": 47181
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 55
      },
      "furgoneta_van": {
        "PHEV": 508,
        "HEV": 84
      },
      "moto": {
        "BEV": 231,
        "PHEV": -12,
        "HEV": 8
      },
      "camion": {
        "BEV": 976,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 102
      },
      "especial": {
        "BEV": 504,
        "PHEV": 1,
        "HEV": 34
      },
      "otros": {
        "BEV": 173,
        "HEV": 10
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
      "BEV": 6578,
      "PHEV": 2400,
      "HEV": 50831,
      "REEV": 298
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 3528,
        "PHEV": 1881,
        "HEV": 50626
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 55
      },
      "furgoneta_van": {
        "PHEV": 530,
        "HEV": 89
      },
      "moto": {
        "BEV": 528,
        "PHEV": -12,
        "HEV": 11
      },
      "camion": {
        "BEV": 998,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 104
      },
      "especial": {
        "BEV": 530,
        "PHEV": 1,
        "HEV": 36
      },
      "otros": {
        "BEV": 174,
        "HEV": 10
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
      "BEV": 7009,
      "PHEV": 2626,
      "HEV": 55538,
      "REEV": 330
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 3707,
        "PHEV": 2071,
        "HEV": 55319
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 55
      },
      "furgoneta_van": {
        "PHEV": 564,
        "HEV": 91
      },
      "moto": {
        "BEV": 673,
        "PHEV": -12,
        "HEV": 13
      },
      "camion": {
        "BEV": 1056,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 126,
        "PHEV": 2
      },
      "especial": {
        "BEV": 571,
        "PHEV": 1,
        "HEV": 41
      },
      "otros": {
        "BEV": 169,
        "HEV": 15
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
      "BEV": 7511,
      "PHEV": 2960,
      "HEV": 60901,
      "REEV": 368
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 4022,
        "PHEV": 2370,
        "HEV": 60668
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 55
      },
      "furgoneta_van": {
        "PHEV": 601,
        "HEV": 100
      },
      "moto": {
        "BEV": 743,
        "PHEV": -12,
        "HEV": 13
      },
      "camion": {
        "BEV": 1094,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 134,
        "PHEV": 2
      },
      "especial": {
        "BEV": 603,
        "PHEV": 1,
        "HEV": 45
      },
      "otros": {
        "BEV": 179,
        "HEV": 16
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
      "BEV": 8246,
      "PHEV": 3282,
      "HEV": 65754,
      "REEV": 407
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 4264,
        "PHEV": 2647,
        "HEV": 65513
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 55
      },
      "furgoneta_van": {
        "PHEV": 647,
        "HEV": 105
      },
      "moto": {
        "BEV": 1115,
        "PHEV": -12,
        "HEV": 12
      },
      "camion": {
        "BEV": 1121,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 136,
        "PHEV": 2
      },
      "especial": {
        "BEV": 644,
        "PHEV": 1,
        "HEV": 49
      },
      "otros": {
        "BEV": 181,
        "HEV": 16
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
      "BEV": 8938,
      "PHEV": 3601,
      "HEV": 69884,
      "REEV": 417
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 4569,
        "PHEV": 2951,
        "HEV": 69634
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 55
      },
      "furgoneta_van": {
        "PHEV": 662,
        "HEV": 109
      },
      "moto": {
        "BEV": 1261,
        "PHEV": -12,
        "HEV": 13
      },
      "camion": {
        "BEV": 1159,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 142,
        "PHEV": 2
      },
      "especial": {
        "BEV": 667,
        "PHEV": 1,
        "HEV": 51
      },
      "otros": {
        "BEV": 201,
        "HEV": 18
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
      "BEV": 9901,
      "PHEV": 3900,
      "HEV": 73824,
      "REEV": 439
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 5101,
        "PHEV": 3216,
        "HEV": 73563
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 55
      },
      "furgoneta_van": {
        "PHEV": 695,
        "HEV": 117
      },
      "moto": {
        "BEV": 1483,
        "PHEV": -12,
        "HEV": 14
      },
      "camion": {
        "BEV": 1204,
        "PHEV": 3,
        "HEV": 3
      },
      "autobus": {
        "BEV": 168,
        "PHEV": 2,
        "HEV": 1
      },
      "especial": {
        "BEV": 700,
        "PHEV": 2,
        "HEV": 52
      },
      "otros": {
        "BEV": 201,
        "HEV": 18
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
      "BEV": 11374,
      "PHEV": 4223,
      "HEV": 78453,
      "REEV": 454
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 5921,
        "PHEV": 3518,
        "HEV": 78176
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 55
      },
      "furgoneta_van": {
        "PHEV": 715,
        "HEV": 122
      },
      "moto": {
        "BEV": 1834,
        "PHEV": -12,
        "HEV": 18
      },
      "camion": {
        "BEV": 1342,
        "PHEV": 4,
        "HEV": 3
      },
      "autobus": {
        "BEV": 181,
        "PHEV": 2,
        "HEV": 1
      },
      "especial": {
        "BEV": 739,
        "PHEV": 2,
        "HEV": 58
      },
      "otros": {
        "BEV": 212,
        "HEV": 19
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
      "BEV": 12339,
      "PHEV": 4580,
      "HEV": 83645,
      "REEV": 479
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 6173,
        "PHEV": 3842,
        "HEV": 83354
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 55
      },
      "furgoneta_van": {
        "PHEV": 748,
        "HEV": 126
      },
      "moto": {
        "BEV": 2264,
        "PHEV": -12,
        "HEV": 23
      },
      "camion": {
        "BEV": 1375,
        "PHEV": 4,
        "HEV": 3
      },
      "autobus": {
        "BEV": 181,
        "PHEV": 2,
        "HEV": 1
      },
      "especial": {
        "BEV": 801,
        "PHEV": 2,
        "HEV": 61
      },
      "otros": {
        "BEV": 225,
        "HEV": 21
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
      "BEV": 13200,
      "PHEV": 5105,
      "HEV": 87887,
      "REEV": 523
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 6585,
        "PHEV": 4286,
        "HEV": 87555
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 88
      },
      "furgoneta_van": {
        "PHEV": 831,
        "HEV": 130
      },
      "moto": {
        "BEV": 2371,
        "PHEV": -13,
        "HEV": 23
      },
      "camion": {
        "BEV": 1431,
        "PHEV": 4,
        "HEV": 3
      },
      "autobus": {
        "BEV": 185,
        "PHEV": 2,
        "HEV": 1
      },
      "especial": {
        "BEV": 851,
        "PHEV": 2,
        "HEV": 65
      },
      "otros": {
        "BEV": 221,
        "HEV": 21
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
      "BEV": 14405,
      "PHEV": 5464,
      "HEV": 93619,
      "REEV": 541
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 6935,
        "PHEV": 4613,
        "HEV": 93258
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 99
      },
      "furgoneta_van": {
        "PHEV": 863,
        "HEV": 136
      },
      "moto": {
        "BEV": 2970,
        "PHEV": -13,
        "HEV": 31
      },
      "camion": {
        "BEV": 1522,
        "PHEV": 4,
        "HEV": 3
      },
      "autobus": {
        "BEV": 210,
        "PHEV": 2,
        "HEV": 1
      },
      "especial": {
        "BEV": 882,
        "PHEV": 2,
        "HEV": 69
      },
      "otros": {
        "BEV": 227,
        "HEV": 21
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
      "BEV": 15052,
      "PHEV": 5805,
      "HEV": 98637,
      "REEV": 559
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 7288,
        "PHEV": 4919,
        "HEV": 98260
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 99
      },
      "furgoneta_van": {
        "PHEV": 898,
        "HEV": 139
      },
      "moto": {
        "BEV": 3120,
        "PHEV": -13,
        "HEV": 39
      },
      "camion": {
        "BEV": 1566,
        "PHEV": 4,
        "HEV": 3
      },
      "autobus": {
        "BEV": 221,
        "PHEV": 2,
        "HEV": 1
      },
      "especial": {
        "BEV": 911,
        "PHEV": 2,
        "HEV": 74
      },
      "otros": {
        "BEV": 253,
        "HEV": 21
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
      "BEV": 16501,
      "PHEV": 6105,
      "HEV": 103758,
      "REEV": 571
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 7714,
        "PHEV": 5186,
        "HEV": 103364
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 109
      },
      "furgoneta_van": {
        "PHEV": 932,
        "HEV": 141
      },
      "moto": {
        "BEV": 3274,
        "PHEV": -14,
        "HEV": 39
      },
      "camion": {
        "BEV": 1653,
        "PHEV": 4,
        "HEV": 3
      },
      "autobus": {
        "BEV": 237,
        "PHEV": 2,
        "HEV": 1
      },
      "especial": {
        "BEV": 959,
        "PHEV": 2,
        "HEV": 77
      },
      "otros": {
        "BEV": 252,
        "HEV": 23
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
      "BEV": 17451,
      "PHEV": 6363,
      "HEV": 109496,
      "REEV": 594
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 8140,
        "PHEV": 5413,
        "HEV": 109086
      },
      "suv_todo_terreno": {
        "BEV": 2,
        "HEV": 109
      },
      "furgoneta_van": {
        "PHEV": 963,
        "HEV": 147
      },
      "moto": {
        "BEV": 3527,
        "PHEV": -14,
        "HEV": 42
      },
      "camion": {
        "BEV": 1743,
        "PHEV": 4,
        "HEV": 3
      },
      "autobus": {
        "BEV": 247,
        "PHEV": 2,
        "HEV": 1
      },
      "especial": {
        "BEV": 1032,
        "PHEV": 2,
        "HEV": 83
      },
      "otros": {
        "BEV": 259,
        "HEV": 24
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
      "BEV": 18323,
      "PHEV": 6806,
      "HEV": 116149,
      "REEV": 613
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 8426,
        "PHEV": 5805,
        "HEV": 115705
      },
      "suv_todo_terreno": {
        "BEV": 3,
        "HEV": 119
      },
      "furgoneta_van": {
        "PHEV": 1014,
        "HEV": 148
      },
      "moto": {
        "BEV": 3623,
        "PHEV": -14,
        "HEV": 55
      },
      "camion": {
        "BEV": 1783,
        "PHEV": 4,
        "HEV": 3
      },
      "autobus": {
        "BEV": 249,
        "PHEV": 2,
        "HEV": 1
      },
      "especial": {
        "BEV": 1105,
        "PHEV": 2,
        "HEV": 90
      },
      "otros": {
        "BEV": 261,
        "HEV": 27
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
      "BEV": 19511,
      "PHEV": 7705,
      "HEV": 123898,
      "REEV": 656
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 8755,
        "PHEV": 6644,
        "HEV": 123427
      },
      "suv_todo_terreno": {
        "BEV": 3,
        "HEV": 119
      },
      "furgoneta_van": {
        "PHEV": 1072,
        "HEV": 153
      },
      "moto": {
        "BEV": 3783,
        "PHEV": -14,
        "HEV": 70
      },
      "camion": {
        "BEV": 1847,
        "PHEV": 4,
        "HEV": 3
      },
      "autobus": {
        "BEV": 265,
        "PHEV": 2,
        "HEV": 1
      },
      "especial": {
        "BEV": 1148,
        "PHEV": 3,
        "HEV": 93
      },
      "otros": {
        "BEV": 273,
        "PHEV": 1,
        "HEV": 31
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
      "BEV": 20272,
      "PHEV": 8165,
      "HEV": 131081,
      "REEV": 678
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 9099,
        "PHEV": 7008,
        "HEV": 130605
      },
      "suv_todo_terreno": {
        "BEV": 7,
        "HEV": 119
      },
      "furgoneta_van": {
        "PHEV": 1169,
        "HEV": 154
      },
      "moto": {
        "BEV": 3840,
        "PHEV": -15,
        "HEV": 71
      },
      "camion": {
        "BEV": 1873,
        "PHEV": 4,
        "HEV": 3
      },
      "autobus": {
        "BEV": 298,
        "PHEV": 2,
        "HEV": 1
      },
      "especial": {
        "BEV": 1205,
        "PHEV": 3,
        "HEV": 95
      },
      "otros": {
        "BEV": 284,
        "PHEV": 1,
        "HEV": 32
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
      "BEV": 20879,
      "PHEV": 8569,
      "HEV": 136897,
      "REEV": 708
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 9378,
        "PHEV": 7271,
        "HEV": 136397
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 119
      },
      "furgoneta_van": {
        "PHEV": 1309,
        "HEV": 169
      },
      "moto": {
        "BEV": 3978,
        "PHEV": -15,
        "HEV": 73
      },
      "camion": {
        "BEV": 1927,
        "PHEV": 4,
        "HEV": 3
      },
      "autobus": {
        "BEV": 308,
        "PHEV": 2,
        "HEV": 1
      },
      "especial": {
        "BEV": 1245,
        "PHEV": 3,
        "HEV": 99
      },
      "otros": {
        "BEV": 285,
        "PHEV": 1,
        "HEV": 35
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
      "BEV": 22440,
      "PHEV": 8932,
      "HEV": 142050,
      "REEV": 733,
      "FCEV": 1
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 9850,
        "PHEV": 7559,
        "HEV": 141498
      },
      "suv_todo_terreno": {
        "BEV": 10,
        "HEV": 119
      },
      "furgoneta_van": {
        "BEV": 1,
        "PHEV": 1382,
        "HEV": 204
      },
      "moto": {
        "BEV": 4655,
        "PHEV": -13,
        "HEV": 84
      },
      "camion": {
        "BEV": 2000,
        "PHEV": 4,
        "HEV": 3
      },
      "autobus": {
        "BEV": 329,
        "PHEV": 2,
        "HEV": 1
      },
      "especial": {
        "BEV": 1304,
        "PHEV": 3,
        "HEV": 105
      },
      "otros": {
        "BEV": 299,
        "PHEV": 1,
        "HEV": 35
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
      "BEV": 23786,
      "PHEV": 9332,
      "HEV": 148384,
      "REEV": 766,
      "FCEV": 1
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 10411,
        "PHEV": 7881,
        "HEV": 147770
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 119
      },
      "furgoneta_van": {
        "BEV": 1,
        "PHEV": 1460,
        "HEV": 253
      },
      "moto": {
        "BEV": 4933,
        "PHEV": -13,
        "HEV": 92
      },
      "camion": {
        "BEV": 2089,
        "PHEV": 4,
        "HEV": 4
      },
      "autobus": {
        "BEV": 359,
        "PHEV": 2,
        "HEV": 1
      },
      "especial": {
        "BEV": 1379,
        "PHEV": 3,
        "HEV": 109
      },
      "otros": {
        "BEV": 337,
        "PHEV": 1,
        "HEV": 36
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
      "BEV": 25172,
      "PHEV": 9819,
      "HEV": 154098,
      "REEV": 795,
      "FCEV": 1
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 11075,
        "PHEV": 8250,
        "HEV": 153450
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 119
      },
      "furgoneta_van": {
        "BEV": 1,
        "PHEV": 1576,
        "HEV": 278
      },
      "moto": {
        "BEV": 5140,
        "PHEV": -13,
        "HEV": 94
      },
      "camion": {
        "BEV": 2175,
        "PHEV": 4,
        "HEV": 4
      },
      "autobus": {
        "BEV": 372,
        "PHEV": 2,
        "HEV": 1
      },
      "especial": {
        "BEV": 1438,
        "PHEV": 5,
        "HEV": 113
      },
      "otros": {
        "BEV": 376,
        "PHEV": 1,
        "HEV": 39
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
      "BEV": 27338,
      "PHEV": 10651,
      "HEV": 159555,
      "REEV": 811,
      "FCEV": 1
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 12453,
        "PHEV": 8959,
        "HEV": 158858
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 119
      },
      "furgoneta_van": {
        "BEV": 1,
        "PHEV": 1699,
        "HEV": 322
      },
      "moto": {
        "BEV": 5202,
        "PHEV": -13,
        "HEV": 93
      },
      "camion": {
        "BEV": 2401,
        "PHEV": 4,
        "HEV": 4
      },
      "autobus": {
        "BEV": 387,
        "PHEV": 2,
        "HEV": 1
      },
      "especial": {
        "BEV": 1487,
        "PHEV": 5,
        "HEV": 118
      },
      "otros": {
        "BEV": 398,
        "PHEV": 1,
        "HEV": 41
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
      "BEV": 28626,
      "PHEV": 11171,
      "HEV": 166847,
      "REEV": 823,
      "FCEV": 1
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 13074,
        "PHEV": 9327,
        "HEV": 166031
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 119
      },
      "furgoneta_van": {
        "BEV": 1,
        "PHEV": 1851,
        "HEV": 430
      },
      "moto": {
        "BEV": 5248,
        "PHEV": -13,
        "HEV": 99
      },
      "camion": {
        "BEV": 2483,
        "PHEV": 4,
        "HEV": 4
      },
      "autobus": {
        "BEV": 405,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 1580,
        "PHEV": 5,
        "HEV": 122
      },
      "otros": {
        "BEV": 405,
        "PHEV": 1,
        "HEV": 41
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
      "BEV": 30225,
      "PHEV": 11643,
      "HEV": 173544,
      "REEV": 845,
      "FCEV": 1
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 13944,
        "PHEV": 9663,
        "HEV": 172616
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 137
      },
      "furgoneta_van": {
        "BEV": 1,
        "PHEV": 1986,
        "HEV": 515
      },
      "moto": {
        "BEV": 5363,
        "PHEV": -13,
        "HEV": 107
      },
      "camion": {
        "BEV": 2570,
        "PHEV": 5,
        "HEV": 4
      },
      "autobus": {
        "BEV": 412,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 1641,
        "PHEV": 5,
        "HEV": 122
      },
      "otros": {
        "BEV": 419,
        "PHEV": 1,
        "HEV": 42
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
      "BEV": 32127,
      "PHEV": 12442,
      "HEV": 181049,
      "REEV": 866,
      "FCEV": 1
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 15242,
        "PHEV": 10312,
        "HEV": 179970
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 138
      },
      "furgoneta_van": {
        "BEV": 2,
        "PHEV": 2136,
        "HEV": 659
      },
      "moto": {
        "BEV": 5581,
        "PHEV": -13,
        "HEV": 108
      },
      "camion": {
        "BEV": 2674,
        "PHEV": 5,
        "HEV": 4
      },
      "autobus": {
        "BEV": 417,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 1705,
        "PHEV": 5,
        "HEV": 124
      },
      "otros": {
        "BEV": 440,
        "PHEV": 2,
        "HEV": 45
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
      "BEV": 33241,
      "PHEV": 13120,
      "HEV": 188551,
      "REEV": 886,
      "FCEV": 1
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 15887,
        "PHEV": 10873,
        "HEV": 187238
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 144
      },
      "furgoneta_van": {
        "BEV": 2,
        "PHEV": 2253,
        "HEV": 871
      },
      "moto": {
        "BEV": 5620,
        "PHEV": -13,
        "HEV": 115
      },
      "camion": {
        "BEV": 2746,
        "PHEV": 5,
        "HEV": 6
      },
      "autobus": {
        "BEV": 426,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 1760,
        "PHEV": 5,
        "HEV": 129
      },
      "otros": {
        "BEV": 450,
        "PHEV": 2,
        "HEV": 47
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
      "BEV": 35063,
      "PHEV": 13791,
      "HEV": 198726,
      "REEV": 904,
      "FCEV": 0
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 16877,
        "PHEV": 11468,
        "HEV": 197080
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 176
      },
      "furgoneta_van": {
        "BEV": 2,
        "PHEV": 2329,
        "HEV": 1149
      },
      "moto": {
        "BEV": 6057,
        "PHEV": -13,
        "HEV": 124
      },
      "camion": {
        "BEV": 2869,
        "PHEV": 5,
        "HEV": 9
      },
      "autobus": {
        "BEV": 429,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 1829,
        "PHEV": 5,
        "HEV": 136
      },
      "otros": {
        "BEV": 462,
        "PHEV": 2,
        "HEV": 51
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
      "BEV": 37710,
      "PHEV": 14250,
      "HEV": 207774,
      "REEV": 916,
      "FCEV": 0
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 18021,
        "PHEV": 11859,
        "HEV": 205788
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 176
      },
      "furgoneta_van": {
        "BEV": 2,
        "PHEV": 2396,
        "HEV": 1447
      },
      "moto": {
        "BEV": 7146,
        "PHEV": -13,
        "HEV": 155
      },
      "camion": {
        "BEV": 2997,
        "PHEV": 5,
        "HEV": 17
      },
      "autobus": {
        "BEV": 452,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 1909,
        "PHEV": 6,
        "HEV": 138
      },
      "otros": {
        "BEV": 498,
        "PHEV": 2,
        "HEV": 52
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
      "BEV": 40230,
      "PHEV": 14735,
      "HEV": 217293,
      "REEV": 940,
      "FCEV": 0
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 18695,
        "PHEV": 12255,
        "HEV": 214885
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 194
      },
      "furgoneta_van": {
        "BEV": 2,
        "PHEV": 2484,
        "HEV": 1838
      },
      "moto": {
        "BEV": 8082,
        "PHEV": -13,
        "HEV": 156
      },
      "camion": {
        "BEV": 3074,
        "PHEV": 5,
        "HEV": 23
      },
      "autobus": {
        "BEV": 462,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 1976,
        "PHEV": 7,
        "HEV": 140
      },
      "otros": {
        "BEV": 523,
        "PHEV": 2,
        "HEV": 56
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
      "BEV": 40804,
      "PHEV": 15175,
      "HEV": 223784,
      "REEV": 949,
      "FCEV": 0
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 19157,
        "PHEV": 12600,
        "HEV": 221125
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 195
      },
      "furgoneta_van": {
        "BEV": 2,
        "PHEV": 2578,
        "HEV": 2049
      },
      "moto": {
        "BEV": 7936,
        "PHEV": -13,
        "HEV": 160
      },
      "camion": {
        "BEV": 3174,
        "PHEV": 5,
        "HEV": 26
      },
      "autobus": {
        "BEV": 469,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 1991,
        "PHEV": 8,
        "HEV": 141
      },
      "otros": {
        "BEV": 544,
        "PHEV": 2,
        "HEV": 87
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
      "BEV": 42524,
      "PHEV": 15685,
      "HEV": 231576,
      "REEV": 963,
      "FCEV": 0
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 19864,
        "PHEV": 12932,
        "HEV": 228422
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 195
      },
      "furgoneta_van": {
        "BEV": 2,
        "PHEV": 2755,
        "HEV": 2477
      },
      "moto": {
        "BEV": 8001,
        "PHEV": -13,
        "HEV": 162
      },
      "camion": {
        "BEV": 3259,
        "PHEV": 6,
        "HEV": 57
      },
      "autobus": {
        "BEV": 483,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 2070,
        "PHEV": 8,
        "HEV": 145
      },
      "otros": {
        "BEV": 568,
        "PHEV": 2,
        "HEV": 117
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
      "BEV": 44224,
      "PHEV": 16456,
      "HEV": 240963,
      "REEV": 983,
      "FCEV": 0
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 20620,
        "PHEV": 13415,
        "HEV": 237084
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 195
      },
      "furgoneta_van": {
        "BEV": 2,
        "PHEV": 3043,
        "HEV": 3107
      },
      "moto": {
        "BEV": 8526,
        "PHEV": -13,
        "HEV": 163
      },
      "camion": {
        "BEV": 3377,
        "PHEV": 6,
        "HEV": 103
      },
      "autobus": {
        "BEV": 488,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 2175,
        "PHEV": 8,
        "HEV": 150
      },
      "otros": {
        "BEV": 620,
        "PHEV": 2,
        "HEV": 160
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
      "BEV": 47173,
      "PHEV": 17282,
      "HEV": 252073,
      "REEV": 998,
      "FCEV": 1
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 21362,
        "PHEV": 13990,
        "HEV": 247546
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 195
      },
      "furgoneta_van": {
        "BEV": 3,
        "PHEV": 3296,
        "HEV": 3655
      },
      "moto": {
        "BEV": 10243,
        "PHEV": -15,
        "HEV": 165
      },
      "camion": {
        "BEV": 3460,
        "PHEV": 6,
        "HEV": 153
      },
      "autobus": {
        "BEV": 497,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 2247,
        "PHEV": 7,
        "HEV": 157
      },
      "otros": {
        "BEV": 634,
        "PHEV": 2,
        "HEV": 200
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
      "BEV": 49316,
      "PHEV": 18096,
      "HEV": 262545,
      "REEV": 999,
      "FCEV": 1
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 22270,
        "PHEV": 14535,
        "HEV": 257300
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 195
      },
      "furgoneta_van": {
        "BEV": 3,
        "PHEV": 3565,
        "HEV": 4201
      },
      "moto": {
        "BEV": 10733,
        "PHEV": -14,
        "HEV": 167
      },
      "camion": {
        "BEV": 3516,
        "PHEV": 6,
        "HEV": 246
      },
      "autobus": {
        "BEV": 505,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 2297,
        "PHEV": 6,
        "HEV": 158
      },
      "otros": {
        "BEV": 632,
        "PHEV": 2,
        "HEV": 276
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
      "BEV": 51969,
      "PHEV": 19532,
      "HEV": 273852,
      "REEV": 1009,
      "FCEV": 1
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 23824,
        "PHEV": 15782,
        "HEV": 267946
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 195
      },
      "furgoneta_van": {
        "BEV": 3,
        "PHEV": 3754,
        "HEV": 4704
      },
      "moto": {
        "BEV": 10824,
        "PHEV": -14,
        "HEV": 170
      },
      "camion": {
        "BEV": 3633,
        "PHEV": 6,
        "HEV": 323
      },
      "autobus": {
        "BEV": 513,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 2337,
        "PHEV": 6,
        "HEV": 160
      },
      "otros": {
        "BEV": 660,
        "PHEV": 2,
        "HEV": 352
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
      "BEV": 54869,
      "PHEV": 20754,
      "HEV": 285365,
      "REEV": 1031,
      "FCEV": 2
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 25324,
        "PHEV": 16819,
        "HEV": 278598
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 195
      },
      "furgoneta_van": {
        "BEV": 3,
        "PHEV": 3940,
        "HEV": 5332
      },
      "moto": {
        "BEV": 11313,
        "PHEV": -15,
        "HEV": 173
      },
      "camion": {
        "BEV": 3699,
        "PHEV": 6,
        "HEV": 446
      },
      "autobus": {
        "BEV": 533,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 2416,
        "PHEV": 6,
        "HEV": 168
      },
      "otros": {
        "BEV": 677,
        "PHEV": 2,
        "HEV": 451
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
      "BEV": 56654,
      "PHEV": 21356,
      "HEV": 290469,
      "REEV": 1035,
      "FCEV": 2
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 25849,
        "PHEV": 17315,
        "HEV": 283365
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 195
      },
      "furgoneta_van": {
        "BEV": 3,
        "PHEV": 4047,
        "HEV": 5575
      },
      "moto": {
        "BEV": 11903,
        "PHEV": -16,
        "HEV": 180
      },
      "camion": {
        "BEV": 3745,
        "PHEV": 6,
        "HEV": 500
      },
      "autobus": {
        "BEV": 537,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 2463,
        "PHEV": 6,
        "HEV": 169
      },
      "otros": {
        "BEV": 680,
        "PHEV": 2,
        "HEV": 483
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
      "BEV": 56268,
      "PHEV": 21416,
      "HEV": 290572,
      "REEV": 1033,
      "FCEV": 2
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 25907,
        "PHEV": 17362,
        "HEV": 283391
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 195
      },
      "furgoneta_van": {
        "BEV": 3,
        "PHEV": 4060,
        "HEV": 5620
      },
      "moto": {
        "BEV": 12174,
        "PHEV": -16,
        "HEV": 181
      },
      "camion": {
        "BEV": 3751,
        "PHEV": 6,
        "HEV": 520
      },
      "autobus": {
        "BEV": 537,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 2514,
        "PHEV": 6,
        "HEV": 169
      },
      "otros": {
        "BEV": 679,
        "PHEV": 2,
        "HEV": 494
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
      "BEV": 58182,
      "PHEV": 22145,
      "HEV": 294944,
      "REEV": 1041,
      "FCEV": 2
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 26098,
        "PHEV": 17967,
        "HEV": 287416
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 195
      },
      "furgoneta_van": {
        "BEV": 3,
        "PHEV": 4183,
        "HEV": 5904
      },
      "moto": {
        "BEV": 13773,
        "PHEV": -16,
        "HEV": 185
      },
      "camion": {
        "BEV": 3796,
        "PHEV": 6,
        "HEV": 562
      },
      "autobus": {
        "BEV": 539,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 2589,
        "PHEV": 7,
        "HEV": 170
      },
      "otros": {
        "BEV": 680,
        "PHEV": 2,
        "HEV": 510
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
      "BEV": 59955,
      "PHEV": 23589,
      "HEV": 305949,
      "REEV": 1055,
      "FCEV": 2
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 26848,
        "PHEV": 19132,
        "HEV": 297597
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 205
      },
      "furgoneta_van": {
        "BEV": 3,
        "PHEV": 4464,
        "HEV": 6550
      },
      "moto": {
        "BEV": 14445,
        "PHEV": -18,
        "HEV": 195
      },
      "camion": {
        "BEV": 3861,
        "PHEV": 6,
        "HEV": 673
      },
      "autobus": {
        "BEV": 543,
        "PHEV": 2,
        "HEV": 2
      },
      "especial": {
        "BEV": 2687,
        "PHEV": 7,
        "HEV": 173
      },
      "otros": {
        "BEV": 693,
        "PHEV": 2,
        "HEV": 554
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
      "BEV": 62685,
      "PHEV": 25923,
      "HEV": 323312,
      "REEV": 1071,
      "FCEV": 2
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 28136,
        "PHEV": 21146,
        "HEV": 313947
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 222
      },
      "furgoneta_van": {
        "BEV": 3,
        "PHEV": 4785,
        "HEV": 7288
      },
      "moto": {
        "BEV": 15621,
        "PHEV": -19,
        "HEV": 200
      },
      "camion": {
        "BEV": 3936,
        "PHEV": 6,
        "HEV": 836
      },
      "autobus": {
        "BEV": 549,
        "PHEV": 2,
        "HEV": 3
      },
      "especial": {
        "BEV": 2774,
        "PHEV": 7,
        "HEV": 178
      },
      "otros": {
        "BEV": 709,
        "PHEV": 2,
        "HEV": 638
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
      "BEV": 64300,
      "PHEV": 27197,
      "HEV": 332822,
      "REEV": 1082,
      "FCEV": 2
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 29049,
        "PHEV": 22174,
        "HEV": 322954
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 225
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 5032,
        "HEV": 7634
      },
      "moto": {
        "BEV": 15829,
        "PHEV": -19,
        "HEV": 209
      },
      "camion": {
        "BEV": 4047,
        "PHEV": 6,
        "HEV": 904
      },
      "autobus": {
        "BEV": 561,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 2796,
        "PHEV": 7,
        "HEV": 180
      },
      "otros": {
        "BEV": 729,
        "PHEV": 2,
        "HEV": 710
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
      "BEV": 67330,
      "PHEV": 29119,
      "HEV": 343646,
      "REEV": 1093,
      "FCEV": 2
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 30979,
        "PHEV": 23766,
        "HEV": 333059
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 228
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 5362,
        "HEV": 8071
      },
      "moto": {
        "BEV": 16275,
        "PHEV": -19,
        "HEV": 210
      },
      "camion": {
        "BEV": 4302,
        "PHEV": 6,
        "HEV": 1052
      },
      "autobus": {
        "BEV": 578,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 2848,
        "PHEV": 7,
        "HEV": 185
      },
      "otros": {
        "BEV": 728,
        "PHEV": 2,
        "HEV": 835
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
      "BEV": 69919,
      "PHEV": 31566,
      "HEV": 355984,
      "REEV": 1113,
      "FCEV": 2
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 32652,
        "PHEV": 25937,
        "HEV": 344303
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 228
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 5632,
        "HEV": 8769
      },
      "moto": {
        "BEV": 16609,
        "PHEV": -18,
        "HEV": 214
      },
      "camion": {
        "BEV": 4474,
        "PHEV": 10,
        "HEV": 1281
      },
      "autobus": {
        "BEV": 579,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 2902,
        "PHEV": 7,
        "HEV": 194
      },
      "otros": {
        "BEV": 773,
        "PHEV": 2,
        "HEV": 989
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
      "BEV": 72429,
      "PHEV": 34452,
      "HEV": 370467,
      "REEV": 1129,
      "FCEV": 3
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 34254,
        "PHEV": 28452,
        "HEV": 357606
      },
      "suv_todo_terreno": {
        "BEV": 8,
        "HEV": 228
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 6001,
        "HEV": 9445
      },
      "moto": {
        "BEV": 16936,
        "PHEV": -18,
        "HEV": 215
      },
      "camion": {
        "BEV": 4646,
        "PHEV": 14,
        "HEV": 1578
      },
      "autobus": {
        "BEV": 581,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 2959,
        "PHEV": 6,
        "HEV": 204
      },
      "otros": {
        "BEV": 762,
        "PHEV": 4,
        "HEV": 1185
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
      "BEV": 76971,
      "PHEV": 40832,
      "HEV": 391958,
      "REEV": 1131,
      "FCEV": 8
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 38001,
        "PHEV": 34199,
        "HEV": 377547
      },
      "suv_todo_terreno": {
        "BEV": 22,
        "HEV": 228
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 6634,
        "HEV": 10665
      },
      "moto": {
        "BEV": 17410,
        "PHEV": -18,
        "HEV": 218
      },
      "camion": {
        "BEV": 4808,
        "PHEV": 14,
        "HEV": 1742
      },
      "autobus": {
        "BEV": 585,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 2999,
        "PHEV": 6,
        "HEV": 206
      },
      "otros": {
        "BEV": 784,
        "PHEV": 4,
        "HEV": 1346
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
      "BEV": 77630,
      "PHEV": 42210,
      "HEV": 400122,
      "REEV": 1131,
      "FCEV": 8
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 38298,
        "PHEV": 35348,
        "HEV": 385060
      },
      "suv_todo_terreno": {
        "BEV": 22,
        "HEV": 227
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 6862,
        "HEV": 11135
      },
      "moto": {
        "BEV": 17697,
        "PHEV": -18,
        "HEV": 220
      },
      "camion": {
        "BEV": 4849,
        "PHEV": 14,
        "HEV": 1818
      },
      "autobus": {
        "BEV": 593,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 3041,
        "PHEV": 7,
        "HEV": 213
      },
      "otros": {
        "BEV": 790,
        "PHEV": 4,
        "HEV": 1443
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
      "BEV": 78120,
      "PHEV": 44314,
      "HEV": 412238,
      "REEV": 1142,
      "FCEV": 11
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 38813,
        "PHEV": 37141,
        "HEV": 396116
      },
      "suv_todo_terreno": {
        "BEV": 22,
        "HEV": 238
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 7173,
        "HEV": 11868
      },
      "moto": {
        "BEV": 17386,
        "PHEV": -18,
        "HEV": 223
      },
      "camion": {
        "BEV": 4938,
        "PHEV": 14,
        "HEV": 1977
      },
      "autobus": {
        "BEV": 612,
        "PHEV": 2,
        "HEV": 4
      },
      "especial": {
        "BEV": 3115,
        "PHEV": 7,
        "HEV": 222
      },
      "otros": {
        "BEV": 811,
        "PHEV": 4,
        "HEV": 1588
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
      "BEV": 81083,
      "PHEV": 47786,
      "HEV": 429022,
      "REEV": 1152,
      "FCEV": 11
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 40558,
        "PHEV": 40047,
        "HEV": 411559
      },
      "suv_todo_terreno": {
        "BEV": 22,
        "HEV": 245
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 7741,
        "HEV": 12795
      },
      "moto": {
        "BEV": 18106,
        "PHEV": -20,
        "HEV": 223
      },
      "camion": {
        "BEV": 5046,
        "PHEV": 14,
        "HEV": 2196
      },
      "autobus": {
        "BEV": 634,
        "PHEV": 2,
        "HEV": 5
      },
      "especial": {
        "BEV": 3209,
        "PHEV": 7,
        "HEV": 227
      },
      "otros": {
        "BEV": 820,
        "PHEV": 4,
        "HEV": 1770
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
      "BEV": 83388,
      "PHEV": 50790,
      "HEV": 446166,
      "REEV": 1159,
      "FCEV": 12
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 41734,
        "PHEV": 42599,
        "HEV": 427219
      },
      "suv_todo_terreno": {
        "BEV": 22,
        "HEV": 245
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 8193,
        "HEV": 13862
      },
      "moto": {
        "BEV": 18464,
        "PHEV": -20,
        "HEV": 224
      },
      "camion": {
        "BEV": 5306,
        "PHEV": 14,
        "HEV": 2439
      },
      "autobus": {
        "BEV": 660,
        "PHEV": 2,
        "HEV": 6
      },
      "especial": {
        "BEV": 3247,
        "PHEV": 7,
        "HEV": 230
      },
      "otros": {
        "BEV": 828,
        "PHEV": 4,
        "HEV": 1939
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
      "BEV": 85858,
      "PHEV": 55102,
      "HEV": 466883,
      "REEV": 1162,
      "FCEV": 12
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 43342,
        "PHEV": 46324,
        "HEV": 446840
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 257
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 8780,
        "HEV": 14659
      },
      "moto": {
        "BEV": 19087,
        "PHEV": -20,
        "HEV": 227
      },
      "camion": {
        "BEV": 5385,
        "PHEV": 14,
        "HEV": 2604
      },
      "autobus": {
        "BEV": 669,
        "PHEV": 2,
        "HEV": 6
      },
      "especial": {
        "BEV": 3320,
        "PHEV": 7,
        "HEV": 233
      },
      "otros": {
        "BEV": 856,
        "PHEV": 4,
        "HEV": 2055
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
      "BEV": 89993,
      "PHEV": 59377,
      "HEV": 491342,
      "REEV": 1166,
      "FCEV": 13
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 45529,
        "PHEV": 49737,
        "HEV": 470049
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 281
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 9640,
        "HEV": 15749
      },
      "moto": {
        "BEV": 19709,
        "PHEV": -20,
        "HEV": 228
      },
      "camion": {
        "BEV": 5524,
        "PHEV": 14,
        "HEV": 2711
      },
      "autobus": {
        "BEV": 690,
        "PHEV": 2,
        "HEV": 6
      },
      "especial": {
        "BEV": 3379,
        "PHEV": 8,
        "HEV": 243
      },
      "otros": {
        "BEV": 864,
        "PHEV": 5,
        "HEV": 2073
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
      "BEV": 92273,
      "PHEV": 63146,
      "HEV": 510344,
      "REEV": 1182,
      "FCEV": 13
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 46897,
        "PHEV": 52867,
        "HEV": 487739
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 281
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 10280,
        "HEV": 16841
      },
      "moto": {
        "BEV": 20003,
        "PHEV": -21,
        "HEV": 229
      },
      "camion": {
        "BEV": 5810,
        "PHEV": 14,
        "HEV": 2833
      },
      "autobus": {
        "BEV": 712,
        "PHEV": 2,
        "HEV": 6
      },
      "especial": {
        "BEV": 3436,
        "PHEV": 7,
        "HEV": 265
      },
      "otros": {
        "BEV": 897,
        "PHEV": 6,
        "HEV": 2148
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
      "BEV": 94205,
      "PHEV": 65630,
      "HEV": 522396,
      "REEV": 1190,
      "FCEV": 12
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 48074,
        "PHEV": 54931,
        "HEV": 499026
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 281
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 10699,
        "HEV": 17492
      },
      "moto": {
        "BEV": 20460,
        "PHEV": -21,
        "HEV": 229
      },
      "camion": {
        "BEV": 5882,
        "PHEV": 15,
        "HEV": 2907
      },
      "autobus": {
        "BEV": 718,
        "PHEV": 2,
        "HEV": 6
      },
      "especial": {
        "BEV": 3465,
        "PHEV": 7,
        "HEV": 269
      },
      "otros": {
        "BEV": 927,
        "PHEV": 6,
        "HEV": 2184
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
      "BEV": 97816,
      "PHEV": 69331,
      "HEV": 536825,
      "REEV": 1190,
      "FCEV": 13
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 50670,
        "PHEV": 57999,
        "HEV": 512364
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 281
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 11331,
        "HEV": 18391
      },
      "moto": {
        "BEV": 20936,
        "PHEV": -21,
        "HEV": 231
      },
      "camion": {
        "BEV": 5965,
        "PHEV": 15,
        "HEV": 3005
      },
      "autobus": {
        "BEV": 738,
        "PHEV": 2,
        "HEV": 6
      },
      "especial": {
        "BEV": 3528,
        "PHEV": 8,
        "HEV": 280
      },
      "otros": {
        "BEV": 960,
        "PHEV": 6,
        "HEV": 2265
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
      "BEV": 99448,
      "PHEV": 73223,
      "HEV": 552606,
      "REEV": 1205,
      "FCEV": 14
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 52861,
        "PHEV": 61302,
        "HEV": 527032
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 290
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 11922,
        "HEV": 19288
      },
      "moto": {
        "BEV": 19893,
        "PHEV": -24,
        "HEV": 232
      },
      "camion": {
        "BEV": 6087,
        "PHEV": 15,
        "HEV": 3122
      },
      "autobus": {
        "BEV": 749,
        "PHEV": 2,
        "HEV": 6
      },
      "especial": {
        "BEV": 3584,
        "PHEV": 10,
        "HEV": 288
      },
      "otros": {
        "BEV": 951,
        "PHEV": 6,
        "HEV": 2346
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
      "BEV": 102826,
      "PHEV": 77290,
      "HEV": 569425,
      "REEV": 1212,
      "FCEV": 16
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 55402,
        "PHEV": 64849,
        "HEV": 542703
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 290
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 12440,
        "HEV": 20169
      },
      "moto": {
        "BEV": 20246,
        "PHEV": -24,
        "HEV": 232
      },
      "camion": {
        "BEV": 6246,
        "PHEV": 16,
        "HEV": 3272
      },
      "autobus": {
        "BEV": 762,
        "PHEV": 2,
        "HEV": 6
      },
      "especial": {
        "BEV": 3650,
        "PHEV": 10,
        "HEV": 294
      },
      "otros": {
        "BEV": 968,
        "PHEV": 6,
        "HEV": 2457
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
      "BEV": 107513,
      "PHEV": 81752,
      "HEV": 591864,
      "REEV": 1227,
      "FCEV": 18
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 58562,
        "PHEV": 68655,
        "HEV": 563877
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 292
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 13097,
        "HEV": 21227
      },
      "moto": {
        "BEV": 20911,
        "PHEV": -26,
        "HEV": 233
      },
      "camion": {
        "BEV": 6603,
        "PHEV": 16,
        "HEV": 3411
      },
      "autobus": {
        "BEV": 783,
        "PHEV": 2,
        "HEV": 6
      },
      "especial": {
        "BEV": 3702,
        "PHEV": 10,
        "HEV": 304
      },
      "otros": {
        "BEV": 992,
        "PHEV": 8,
        "HEV": 2512
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
      "BEV": 109527,
      "PHEV": 84719,
      "HEV": 603894,
      "REEV": 1235,
      "FCEV": 20
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 59987,
        "PHEV": 71250,
        "HEV": 575301
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 292
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 13466,
        "HEV": 21663
      },
      "moto": {
        "BEV": 20892,
        "PHEV": -26,
        "HEV": 233
      },
      "camion": {
        "BEV": 6753,
        "PHEV": 16,
        "HEV": 3508
      },
      "autobus": {
        "BEV": 894,
        "PHEV": 2,
        "HEV": 6
      },
      "especial": {
        "BEV": 3761,
        "PHEV": 11,
        "HEV": 314
      },
      "otros": {
        "BEV": 1010,
        "PHEV": 11,
        "HEV": 2575
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
      "BEV": 112069,
      "PHEV": 88402,
      "HEV": 619850,
      "REEV": 1240,
      "FCEV": 21
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 62075,
        "PHEV": 74186,
        "HEV": 590350
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 292
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 14195,
        "HEV": 22328
      },
      "moto": {
        "BEV": 20609,
        "PHEV": -26,
        "HEV": 233
      },
      "camion": {
        "BEV": 6949,
        "PHEV": 16,
        "HEV": 3627
      },
      "autobus": {
        "BEV": 907,
        "PHEV": 2,
        "HEV": 6
      },
      "especial": {
        "BEV": 3828,
        "PHEV": 11,
        "HEV": 319
      },
      "otros": {
        "BEV": 1027,
        "PHEV": 29,
        "HEV": 2693
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
      "BEV": 116066,
      "PHEV": 91415,
      "HEV": 634334,
      "REEV": 1246,
      "FCEV": 28
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 64917,
        "PHEV": 76693,
        "HEV": 604020
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 292
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 14674,
        "HEV": 22874
      },
      "moto": {
        "BEV": 21395,
        "PHEV": -25,
        "HEV": 233
      },
      "camion": {
        "BEV": 7031,
        "PHEV": 17,
        "HEV": 3802
      },
      "autobus": {
        "BEV": 936,
        "PHEV": 2,
        "HEV": 7
      },
      "especial": {
        "BEV": 3919,
        "PHEV": 11,
        "HEV": 332
      },
      "otros": {
        "BEV": 1076,
        "PHEV": 54,
        "HEV": 2772
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
      "BEV": 118533,
      "PHEV": 95292,
      "HEV": 652243,
      "REEV": 1251,
      "FCEV": 28
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 66448,
        "PHEV": 79870,
        "HEV": 620608
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 292
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 15361,
        "HEV": 23942
      },
      "moto": {
        "BEV": 22016,
        "PHEV": -25,
        "HEV": 233
      },
      "camion": {
        "BEV": 7122,
        "PHEV": 18,
        "HEV": 3960
      },
      "autobus": {
        "BEV": 966,
        "PHEV": 2,
        "HEV": 7
      },
      "especial": {
        "BEV": 3970,
        "PHEV": 13,
        "HEV": 336
      },
      "otros": {
        "BEV": 1091,
        "PHEV": 64,
        "HEV": 2863
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
      "BEV": 121010,
      "PHEV": 99793,
      "HEV": 675549,
      "REEV": 1259,
      "FCEV": 28
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 68004,
        "PHEV": 83488,
        "HEV": 642234
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 311
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 16223,
        "HEV": 25122
      },
      "moto": {
        "BEV": 22455,
        "PHEV": -24,
        "HEV": 234
      },
      "camion": {
        "BEV": 7302,
        "PHEV": 18,
        "HEV": 4282
      },
      "autobus": {
        "BEV": 998,
        "PHEV": 2,
        "HEV": 7
      },
      "especial": {
        "BEV": 4049,
        "PHEV": 12,
        "HEV": 341
      },
      "otros": {
        "BEV": 1086,
        "PHEV": 85,
        "HEV": 3016
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
      "BEV": 125363,
      "PHEV": 103633,
      "HEV": 699474,
      "REEV": 1267,
      "FCEV": 28
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 70790,
        "PHEV": 86508,
        "HEV": 664723
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 311
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 17030,
        "HEV": 26199
      },
      "moto": {
        "BEV": 23214,
        "PHEV": -24,
        "HEV": 234
      },
      "camion": {
        "BEV": 7488,
        "PHEV": 18,
        "HEV": 4506
      },
      "autobus": {
        "BEV": 1016,
        "PHEV": 2,
        "HEV": 7
      },
      "especial": {
        "BEV": 4136,
        "PHEV": 14,
        "HEV": 349
      },
      "otros": {
        "BEV": 1098,
        "PHEV": 96,
        "HEV": 3143
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
      "BEV": 128777,
      "PHEV": 106969,
      "HEV": 718609,
      "REEV": 1276,
      "FCEV": 28
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 72543,
        "PHEV": 89146,
        "HEV": 682639
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 314
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 17726,
        "HEV": 27179
      },
      "moto": {
        "BEV": 24116,
        "PHEV": -24,
        "HEV": 235
      },
      "camion": {
        "BEV": 7712,
        "PHEV": 18,
        "HEV": 4657
      },
      "autobus": {
        "BEV": 1072,
        "PHEV": 2,
        "HEV": 7
      },
      "especial": {
        "BEV": 4255,
        "PHEV": 15,
        "HEV": 353
      },
      "otros": {
        "BEV": 1162,
        "PHEV": 96,
        "HEV": 3223
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
      "BEV": 131077,
      "PHEV": 109460,
      "HEV": 733206,
      "REEV": 1279,
      "FCEV": 28
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 73580,
        "PHEV": 91332,
        "HEV": 696359
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 326
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 18029,
        "HEV": 27871
      },
      "moto": {
        "BEV": 24790,
        "PHEV": -24,
        "HEV": 236
      },
      "camion": {
        "BEV": 7906,
        "PHEV": 18,
        "HEV": 4766
      },
      "autobus": {
        "BEV": 1113,
        "PHEV": 2,
        "HEV": 7
      },
      "especial": {
        "BEV": 4304,
        "PHEV": 15,
        "HEV": 354
      },
      "otros": {
        "BEV": 1200,
        "PHEV": 98,
        "HEV": 3285
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
      "BEV": 135345,
      "PHEV": 113254,
      "HEV": 752804,
      "REEV": 1297,
      "FCEV": 28
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 76605,
        "PHEV": 94611,
        "HEV": 714910
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 326
      },
      "furgoneta_van": {
        "BEV": 4,
        "PHEV": 18535,
        "HEV": 28716
      },
      "moto": {
        "BEV": 25400,
        "PHEV": -24,
        "HEV": 236
      },
      "camion": {
        "BEV": 8173,
        "PHEV": 19,
        "HEV": 4899
      },
      "autobus": {
        "BEV": 1169,
        "PHEV": 2,
        "HEV": 7
      },
      "especial": {
        "BEV": 4377,
        "PHEV": 16,
        "HEV": 355
      },
      "otros": {
        "BEV": 1219,
        "PHEV": 105,
        "HEV": 3353
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
      "BEV": 139301,
      "PHEV": 116947,
      "HEV": 771035,
      "REEV": 1309,
      "FCEV": 28
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 79134,
        "PHEV": 97755,
        "HEV": 732061
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 326
      },
      "furgoneta_van": {
        "BEV": 6,
        "PHEV": 19086,
        "HEV": 29583
      },
      "moto": {
        "BEV": 26022,
        "PHEV": -24,
        "HEV": 236
      },
      "camion": {
        "BEV": 8430,
        "PHEV": 19,
        "HEV": 5017
      },
      "autobus": {
        "BEV": 1202,
        "PHEV": 2,
        "HEV": 7
      },
      "especial": {
        "BEV": 4460,
        "PHEV": 16,
        "HEV": 354
      },
      "otros": {
        "BEV": 1269,
        "PHEV": 103,
        "HEV": 3449
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
      "BEV": 144082,
      "PHEV": 121414,
      "HEV": 792103,
      "REEV": 1314,
      "FCEV": 28
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 82309,
        "PHEV": 101678,
        "HEV": 751957
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 326
      },
      "furgoneta_van": {
        "BEV": 6,
        "PHEV": 19628,
        "HEV": 30592
      },
      "moto": {
        "BEV": 26784,
        "PHEV": -24,
        "HEV": 235
      },
      "camion": {
        "BEV": 8695,
        "PHEV": 19,
        "HEV": 5112
      },
      "autobus": {
        "BEV": 1267,
        "PHEV": 2,
        "HEV": 7
      },
      "especial": {
        "BEV": 4531,
        "PHEV": 16,
        "HEV": 354
      },
      "otros": {
        "BEV": 1311,
        "PHEV": 105,
        "HEV": 3518
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
      "BEV": 148266,
      "PHEV": 125567,
      "HEV": 810360,
      "REEV": 1318,
      "FCEV": 29
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 85541,
        "PHEV": 105372,
        "HEV": 768695
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 326
      },
      "furgoneta_van": {
        "BEV": 6,
        "PHEV": 20089,
        "HEV": 31973
      },
      "moto": {
        "BEV": 27283,
        "PHEV": -25,
        "HEV": 231
      },
      "camion": {
        "BEV": 9070,
        "PHEV": 19,
        "HEV": 5205
      },
      "autobus": {
        "BEV": 1295,
        "PHEV": 2,
        "HEV": 12
      },
      "especial": {
        "BEV": 4586,
        "PHEV": 16,
        "HEV": 354
      },
      "otros": {
        "BEV": 1324,
        "PHEV": 104,
        "HEV": 3562
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
      "BEV": 152217,
      "PHEV": 129386,
      "HEV": 829039,
      "REEV": 1324,
      "FCEV": 33
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 88733,
        "PHEV": 108536,
        "HEV": 786386
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 326
      },
      "furgoneta_van": {
        "BEV": 6,
        "PHEV": 20744,
        "HEV": 32879
      },
      "moto": {
        "BEV": 27403,
        "PHEV": -25,
        "HEV": 230
      },
      "camion": {
        "BEV": 9470,
        "PHEV": 19,
        "HEV": 5256
      },
      "autobus": {
        "BEV": 1310,
        "PHEV": 2,
        "HEV": 12
      },
      "especial": {
        "BEV": 4649,
        "PHEV": 16,
        "HEV": 355
      },
      "otros": {
        "BEV": 1361,
        "PHEV": 104,
        "HEV": 3593
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
      "BEV": 155951,
      "PHEV": 133851,
      "HEV": 848942,
      "REEV": 1329,
      "FCEV": 33
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 92041,
        "PHEV": 112295,
        "HEV": 805322
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 339
      },
      "furgoneta_van": {
        "BEV": 6,
        "PHEV": 21444,
        "HEV": 33656
      },
      "moto": {
        "BEV": 27310,
        "PHEV": -25,
        "HEV": 255
      },
      "camion": {
        "BEV": 9878,
        "PHEV": 20,
        "HEV": 5369
      },
      "autobus": {
        "BEV": 1347,
        "PHEV": 2,
        "HEV": 13
      },
      "especial": {
        "BEV": 4759,
        "PHEV": 15,
        "HEV": 357
      },
      "otros": {
        "BEV": 1352,
        "PHEV": 110,
        "HEV": 3629
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
      "BEV": 161486,
      "PHEV": 139493,
      "HEV": 875627,
      "REEV": 1331,
      "FCEV": 40
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 96510,
        "PHEV": 117279,
        "HEV": 830755
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 354
      },
      "furgoneta_van": {
        "BEV": 5,
        "PHEV": 22091,
        "HEV": 34570
      },
      "moto": {
        "BEV": 27300,
        "PHEV": -25,
        "HEV": 255
      },
      "camion": {
        "BEV": 10500,
        "PHEV": 20,
        "HEV": 5600
      },
      "autobus": {
        "BEV": 1392,
        "PHEV": 2,
        "HEV": 13
      },
      "especial": {
        "BEV": 4869,
        "PHEV": 15,
        "HEV": 356
      },
      "otros": {
        "BEV": 1442,
        "PHEV": 121,
        "HEV": 3721
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
      "BEV": 166337,
      "PHEV": 143598,
      "HEV": 895865,
      "REEV": 1338,
      "FCEV": 41
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 100040,
        "PHEV": 120792,
        "HEV": 849949
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 358
      },
      "furgoneta_van": {
        "BEV": 5,
        "PHEV": 22676,
        "HEV": 35384
      },
      "moto": {
        "BEV": 27951,
        "PHEV": -25,
        "HEV": 276
      },
      "camion": {
        "BEV": 10759,
        "PHEV": 20,
        "HEV": 5723
      },
      "autobus": {
        "BEV": 1412,
        "PHEV": 2,
        "HEV": 13
      },
      "especial": {
        "BEV": 4942,
        "PHEV": 15,
        "HEV": 355
      },
      "otros": {
        "BEV": 1505,
        "PHEV": 128,
        "HEV": 3804
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
      "BEV": 171970,
      "PHEV": 149284,
      "HEV": 920353,
      "REEV": 1337,
      "FCEV": 41
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 104441,
        "PHEV": 125798,
        "HEV": 873274
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 362
      },
      "furgoneta_van": {
        "BEV": 5,
        "PHEV": 23314,
        "HEV": 36337
      },
      "moto": {
        "BEV": 27517,
        "PHEV": -26,
        "HEV": 293
      },
      "camion": {
        "BEV": 11016,
        "PHEV": 20,
        "HEV": 5826
      },
      "autobus": {
        "BEV": 1472,
        "PHEV": 2,
        "HEV": 13
      },
      "especial": {
        "BEV": 5048,
        "PHEV": 15,
        "HEV": 352
      },
      "otros": {
        "BEV": 1537,
        "PHEV": 171,
        "HEV": 3893
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
      "BEV": 178865,
      "PHEV": 155484,
      "HEV": 948461,
      "REEV": 1345,
      "FCEV": 41
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 110244,
        "PHEV": 131179,
        "HEV": 900032
      },
      "suv_todo_terreno": {
        "BEV": 23,
        "HEV": 362
      },
      "furgoneta_van": {
        "BEV": 5,
        "PHEV": 24126,
        "HEV": 37373
      },
      "moto": {
        "BEV": 27720,
        "PHEV": -26,
        "HEV": 306
      },
      "camion": {
        "BEV": 11413,
        "PHEV": 20,
        "HEV": 6011
      },
      "autobus": {
        "BEV": 1541,
        "PHEV": 2,
        "HEV": 13
      },
      "especial": {
        "BEV": 5159,
        "PHEV": 15,
        "HEV": 351
      },
      "otros": {
        "BEV": 1580,
        "PHEV": 178,
        "HEV": 4010
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
      "BEV": 184118,
      "PHEV": 160206,
      "HEV": 972130,
      "REEV": 1357,
      "FCEV": 44
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 113696,
        "PHEV": 135365,
        "HEV": 922250
      },
      "suv_todo_terreno": {
        "BEV": 24,
        "HEV": 374
      },
      "furgoneta_van": {
        "BEV": 5,
        "PHEV": 24650,
        "HEV": 38392
      },
      "moto": {
        "BEV": 28251,
        "PHEV": -27,
        "HEV": 307
      },
      "camion": {
        "BEV": 11735,
        "PHEV": 20,
        "HEV": 6328
      },
      "autobus": {
        "BEV": 1562,
        "PHEV": 2,
        "HEV": 13
      },
      "especial": {
        "BEV": 5303,
        "PHEV": 15,
        "HEV": 349
      },
      "otros": {
        "BEV": 1644,
        "PHEV": 191,
        "HEV": 4114
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
      "BEV": 189169,
      "PHEV": 163174,
      "HEV": 989039,
      "REEV": 1359,
      "FCEV": 44
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 117286,
        "PHEV": 137956,
        "HEV": 938088
      },
      "suv_todo_terreno": {
        "BEV": 24,
        "HEV": 376
      },
      "furgoneta_van": {
        "BEV": 5,
        "PHEV": 25022,
        "HEV": 39150
      },
      "moto": {
        "BEV": 28793,
        "PHEV": -27,
        "HEV": 307
      },
      "camion": {
        "BEV": 11933,
        "PHEV": 20,
        "HEV": 6510
      },
      "autobus": {
        "BEV": 1605,
        "PHEV": 2,
        "HEV": 13
      },
      "especial": {
        "BEV": 5389,
        "PHEV": 15,
        "HEV": 348
      },
      "otros": {
        "BEV": 1692,
        "PHEV": 196,
        "HEV": 4244
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
      "BEV": 193922,
      "PHEV": 167473,
      "HEV": 1009028,
      "REEV": 1358,
      "FCEV": 46
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 120945,
        "PHEV": 141652,
        "HEV": 956609
      },
      "suv_todo_terreno": {
        "BEV": 24,
        "HEV": 379
      },
      "furgoneta_van": {
        "BEV": 6,
        "PHEV": 25621,
        "HEV": 40225
      },
      "moto": {
        "BEV": 29536,
        "PHEV": -28,
        "HEV": 307
      },
      "camion": {
        "BEV": 12232,
        "PHEV": 20,
        "HEV": 6720
      },
      "autobus": {
        "BEV": 1627,
        "PHEV": 2,
        "HEV": 13
      },
      "especial": {
        "BEV": 5498,
        "PHEV": 15,
        "HEV": 349
      },
      "otros": {
        "BEV": 1703,
        "PHEV": 201,
        "HEV": 4423
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
      "BEV": 201219,
      "PHEV": 172714,
      "HEV": 1035092,
      "REEV": 1359,
      "FCEV": 48
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 126379,
        "PHEV": 145917,
        "HEV": 981338
      },
      "suv_todo_terreno": {
        "BEV": 24,
        "HEV": 383
      },
      "furgoneta_van": {
        "BEV": 7,
        "PHEV": 26571,
        "HEV": 41174
      },
      "moto": {
        "BEV": 30598,
        "PHEV": -29,
        "HEV": 306
      },
      "camion": {
        "BEV": 12690,
        "PHEV": 32,
        "HEV": 6873
      },
      "autobus": {
        "BEV": 1649,
        "PHEV": 2,
        "HEV": 13
      },
      "especial": {
        "BEV": 5618,
        "PHEV": 16,
        "HEV": 349
      },
      "otros": {
        "BEV": 1772,
        "PHEV": 215,
        "HEV": 4653
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
      "BEV": 208725,
      "PHEV": 178119,
      "HEV": 1058088,
      "REEV": 1366,
      "FCEV": 50
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 132492,
        "PHEV": 150626,
        "HEV": 1002865
      },
      "suv_todo_terreno": {
        "BEV": 24,
        "HEV": 383
      },
      "furgoneta_van": {
        "BEV": 7,
        "PHEV": 27264,
        "HEV": 42285
      },
      "moto": {
        "BEV": 31142,
        "PHEV": -30,
        "HEV": 305
      },
      "camion": {
        "BEV": 13230,
        "PHEV": 33,
        "HEV": 7067
      },
      "autobus": {
        "BEV": 1666,
        "PHEV": 2,
        "HEV": 13
      },
      "especial": {
        "BEV": 5706,
        "PHEV": 16,
        "HEV": 348
      },
      "otros": {
        "BEV": 1840,
        "PHEV": 218,
        "HEV": 4819
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
      "BEV": 215016,
      "PHEV": 184476,
      "HEV": 1082425,
      "REEV": 1362,
      "FCEV": 53
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 138310,
        "PHEV": 156251,
        "HEV": 1025862
      },
      "suv_todo_terreno": {
        "BEV": 24,
        "HEV": 383
      },
      "furgoneta_van": {
        "BEV": 7,
        "PHEV": 27992,
        "HEV": 43376
      },
      "moto": {
        "BEV": 31101,
        "PHEV": -30,
        "HEV": 304
      },
      "camion": {
        "BEV": 13671,
        "PHEV": 38,
        "HEV": 7199
      },
      "autobus": {
        "BEV": 1673,
        "PHEV": 2,
        "HEV": 13
      },
      "especial": {
        "BEV": 5770,
        "PHEV": 16,
        "HEV": 347
      },
      "otros": {
        "BEV": 1870,
        "PHEV": 218,
        "HEV": 4938
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
      "BEV": 219096,
      "PHEV": 188847,
      "HEV": 1105935,
      "REEV": 1367,
      "FCEV": 54
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 141527,
        "PHEV": 159866,
        "HEV": 1048215
      },
      "suv_todo_terreno": {
        "BEV": 24,
        "HEV": 383
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 28739,
        "HEV": 44400
      },
      "moto": {
        "BEV": 31415,
        "PHEV": -30,
        "HEV": 306
      },
      "camion": {
        "BEV": 13894,
        "PHEV": 42,
        "HEV": 7287
      },
      "autobus": {
        "BEV": 1698,
        "PHEV": 2,
        "HEV": 15
      },
      "especial": {
        "BEV": 5857,
        "PHEV": 16,
        "HEV": 346
      },
      "otros": {
        "BEV": 1931,
        "PHEV": 223,
        "HEV": 4980
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
      "BEV": 223589,
      "PHEV": 194178,
      "HEV": 1130546,
      "REEV": 1371,
      "FCEV": 55
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 145165,
        "PHEV": 164500,
        "HEV": 1071900
      },
      "suv_todo_terreno": {
        "BEV": 35,
        "HEV": 387
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 29429,
        "HEV": 45173
      },
      "moto": {
        "BEV": 31609,
        "PHEV": -30,
        "HEV": 321
      },
      "camion": {
        "BEV": 14195,
        "PHEV": 42,
        "HEV": 7388
      },
      "autobus": {
        "BEV": 1722,
        "PHEV": 2,
        "HEV": 15
      },
      "especial": {
        "BEV": 5958,
        "PHEV": 16,
        "HEV": 345
      },
      "otros": {
        "BEV": 1967,
        "PHEV": 230,
        "HEV": 5014
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
      "BEV": 228570,
      "PHEV": 199396,
      "HEV": 1161109,
      "REEV": 1375,
      "FCEV": 55
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 149205,
        "PHEV": 169014,
        "HEV": 1101504
      },
      "suv_todo_terreno": {
        "BEV": 35,
        "HEV": 387
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 30103,
        "HEV": 46043
      },
      "moto": {
        "BEV": 31858,
        "PHEV": -30,
        "HEV": 323
      },
      "camion": {
        "BEV": 14549,
        "PHEV": 42,
        "HEV": 7438
      },
      "autobus": {
        "BEV": 1748,
        "PHEV": 2,
        "HEV": 15
      },
      "especial": {
        "BEV": 6050,
        "PHEV": 16,
        "HEV": 345
      },
      "otros": {
        "BEV": 2005,
        "PHEV": 260,
        "HEV": 5051
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
      "BEV": 232289,
      "PHEV": 204192,
      "HEV": 1188249,
      "REEV": 1385,
      "FCEV": 56
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 152896,
        "PHEV": 173095,
        "HEV": 1127337
      },
      "suv_todo_terreno": {
        "BEV": 35,
        "HEV": 387
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 30797,
        "HEV": 47080
      },
      "moto": {
        "BEV": 32188,
        "PHEV": -30,
        "HEV": 324
      },
      "camion": {
        "BEV": 14831,
        "PHEV": 42,
        "HEV": 7658
      },
      "autobus": {
        "BEV": 1770,
        "PHEV": 2,
        "HEV": 16
      },
      "especial": {
        "BEV": 6152,
        "PHEV": 16,
        "HEV": 345
      },
      "otros": {
        "BEV": 2051,
        "PHEV": 283,
        "HEV": 5099
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
      "BEV": 237668,
      "PHEV": 208813,
      "HEV": 1219916,
      "REEV": 1388,
      "FCEV": 69
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 157139,
        "PHEV": 177021,
        "HEV": 1157920
      },
      "suv_todo_terreno": {
        "BEV": 35,
        "HEV": 387
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 31449,
        "HEV": 48002
      },
      "moto": {
        "BEV": 32666,
        "PHEV": -30,
        "HEV": 337
      },
      "camion": {
        "BEV": 15081,
        "PHEV": 42,
        "HEV": 7742
      },
      "autobus": {
        "BEV": 1805,
        "PHEV": 2,
        "HEV": 16
      },
      "especial": {
        "BEV": 6280,
        "PHEV": 17,
        "HEV": 344
      },
      "otros": {
        "BEV": 2090,
        "PHEV": 325,
        "HEV": 5165
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
      "BEV": 243921,
      "PHEV": 213505,
      "HEV": 1255144,
      "REEV": 1389,
      "FCEV": 76
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 162549,
        "PHEV": 180953,
        "HEV": 1191916
      },
      "suv_todo_terreno": {
        "BEV": 47,
        "HEV": 387
      },
      "furgoneta_van": {
        "BEV": 8,
        "PHEV": 32124,
        "HEV": 49070
      },
      "moto": {
        "BEV": 32966,
        "PHEV": -29,
        "HEV": 341
      },
      "camion": {
        "BEV": 15332,
        "PHEV": 42,
        "HEV": 7815
      },
      "autobus": {
        "BEV": 1829,
        "PHEV": 2,
        "HEV": 21
      },
      "especial": {
        "BEV": 6393,
        "PHEV": 18,
        "HEV": 356
      },
      "otros": {
        "BEV": 2131,
        "PHEV": 408,
        "HEV": 5235
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
      "BEV": 248740,
      "PHEV": 217530,
      "HEV": 1286460,
      "REEV": 1398,
      "FCEV": 100
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 166022,
        "PHEV": 184247,
        "HEV": 1222097
      },
      "suv_todo_terreno": {
        "BEV": 47,
        "HEV": 387
      },
      "furgoneta_van": {
        "BEV": 9,
        "PHEV": 32846,
        "HEV": 50057
      },
      "moto": {
        "BEV": 33639,
        "PHEV": -29,
        "HEV": 337
      },
      "camion": {
        "BEV": 15555,
        "PHEV": 45,
        "HEV": 7857
      },
      "autobus": {
        "BEV": 1868,
        "PHEV": 2,
        "HEV": 23
      },
      "especial": {
        "BEV": 6557,
        "PHEV": 18,
        "HEV": 377
      },
      "otros": {
        "BEV": 2228,
        "PHEV": 414,
        "HEV": 5322
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
      "BEV": 252402,
      "PHEV": 220334,
      "HEV": 1304790,
      "REEV": 1399,
      "FCEV": 110
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 168661,
        "PHEV": 186693,
        "HEV": 1239831
      },
      "suv_todo_terreno": {
        "BEV": 47,
        "HEV": 392
      },
      "furgoneta_van": {
        "BEV": 9,
        "PHEV": 33190,
        "HEV": 50589
      },
      "moto": {
        "BEV": 34167,
        "PHEV": -29,
        "HEV": 336
      },
      "camion": {
        "BEV": 15671,
        "PHEV": 53,
        "HEV": 7899
      },
      "autobus": {
        "BEV": 1890,
        "PHEV": 2,
        "HEV": 23
      },
      "especial": {
        "BEV": 6603,
        "PHEV": 18,
        "HEV": 382
      },
      "otros": {
        "BEV": 2258,
        "PHEV": 420,
        "HEV": 5335
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
      "BEV": 259456,
      "PHEV": 223809,
      "HEV": 1330182,
      "REEV": 1408,
      "FCEV": 113
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 174851,
        "PHEV": 189780,
        "HEV": 1264302
      },
      "suv_todo_terreno": {
        "BEV": 47,
        "HEV": 393
      },
      "furgoneta_van": {
        "BEV": 9,
        "PHEV": 33539,
        "HEV": 51405
      },
      "moto": {
        "BEV": 34590,
        "PHEV": -29,
        "HEV": 339
      },
      "camion": {
        "BEV": 15791,
        "PHEV": 69,
        "HEV": 7949
      },
      "autobus": {
        "BEV": 1911,
        "PHEV": 3,
        "HEV": 23
      },
      "especial": {
        "BEV": 6689,
        "PHEV": 18,
        "HEV": 393
      },
      "otros": {
        "BEV": 2297,
        "PHEV": 442,
        "HEV": 5375
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
      "BEV": 265477,
      "PHEV": 228261,
      "HEV": 1359495,
      "REEV": 1412,
      "FCEV": 117
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 179494,
        "PHEV": 193614,
        "HEV": 1292508
      },
      "suv_todo_terreno": {
        "BEV": 53,
        "HEV": 395
      },
      "furgoneta_van": {
        "BEV": 15,
        "PHEV": 34106,
        "HEV": 52383
      },
      "moto": {
        "BEV": 35427,
        "PHEV": -29,
        "HEV": 336
      },
      "camion": {
        "BEV": 16046,
        "PHEV": 96,
        "HEV": 8011
      },
      "autobus": {
        "BEV": 1948,
        "PHEV": 3,
        "HEV": 23
      },
      "especial": {
        "BEV": 6792,
        "PHEV": 19,
        "HEV": 404
      },
      "otros": {
        "BEV": 2357,
        "PHEV": 465,
        "HEV": 5431
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
      "BEV": 271370,
      "PHEV": 232092,
      "HEV": 1384469,
      "REEV": 1404,
      "FCEV": 117
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 184525,
        "PHEV": 196865,
        "HEV": 1316505
      },
      "suv_todo_terreno": {
        "BEV": 53,
        "HEV": 394
      },
      "furgoneta_van": {
        "BEV": 24,
        "PHEV": 34664,
        "HEV": 53384
      },
      "moto": {
        "BEV": 35813,
        "PHEV": -29,
        "HEV": 329
      },
      "camion": {
        "BEV": 16242,
        "PHEV": 126,
        "HEV": 7979
      },
      "autobus": {
        "BEV": 1970,
        "PHEV": 3,
        "HEV": 23
      },
      "especial": {
        "BEV": 6883,
        "PHEV": 20,
        "HEV": 412
      },
      "otros": {
        "BEV": 2377,
        "PHEV": 457,
        "HEV": 5439
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
      "BEV": 281520,
      "PHEV": 238116,
      "HEV": 1421295,
      "REEV": 1394,
      "FCEV": 117
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 192929,
        "PHEV": 202177,
        "HEV": 1352127
      },
      "suv_todo_terreno": {
        "BEV": 53,
        "HEV": 399
      },
      "furgoneta_van": {
        "BEV": 33,
        "PHEV": 35213,
        "HEV": 54535
      },
      "moto": {
        "BEV": 36561,
        "PHEV": -29,
        "HEV": 324
      },
      "camion": {
        "BEV": 16555,
        "PHEV": 281,
        "HEV": 8004
      },
      "autobus": {
        "BEV": 1996,
        "PHEV": 3,
        "HEV": 23
      },
      "especial": {
        "BEV": 6968,
        "PHEV": 20,
        "HEV": 420
      },
      "otros": {
        "BEV": 2410,
        "PHEV": 466,
        "HEV": 5459
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
      "BEV": 287438,
      "PHEV": 243273,
      "HEV": 1446806,
      "REEV": 1395,
      "FCEV": 117
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 197660,
        "PHEV": 206632,
        "HEV": 1377028
      },
      "suv_todo_terreno": {
        "BEV": 53,
        "HEV": 401
      },
      "furgoneta_van": {
        "BEV": 41,
        "PHEV": 35827,
        "HEV": 55080
      },
      "moto": {
        "BEV": 37022,
        "PHEV": -30,
        "HEV": 324
      },
      "camion": {
        "BEV": 16907,
        "PHEV": 338,
        "HEV": 8019
      },
      "autobus": {
        "BEV": 2036,
        "PHEV": 3,
        "HEV": 23
      },
      "especial": {
        "BEV": 7044,
        "PHEV": 23,
        "HEV": 429
      },
      "otros": {
        "BEV": 2445,
        "PHEV": 495,
        "HEV": 5498
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
      "BEV": 294316,
      "PHEV": 250123,
      "HEV": 1479742,
      "REEV": 1390,
      "FCEV": 117
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 203495,
        "PHEV": 212776,
        "HEV": 1409401
      },
      "suv_todo_terreno": {
        "BEV": 54,
        "HEV": 420
      },
      "furgoneta_van": {
        "BEV": 45,
        "PHEV": 36423,
        "HEV": 55603
      },
      "moto": {
        "BEV": 37251,
        "PHEV": -31,
        "HEV": 322
      },
      "camion": {
        "BEV": 17193,
        "PHEV": 426,
        "HEV": 8001
      },
      "autobus": {
        "BEV": 2058,
        "PHEV": 3,
        "HEV": 23
      },
      "especial": {
        "BEV": 7200,
        "PHEV": 25,
        "HEV": 440
      },
      "otros": {
        "BEV": 2468,
        "PHEV": 516,
        "HEV": 5528
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
      "BEV": 302704,
      "PHEV": 258229,
      "HEV": 1521868,
      "REEV": 1390,
      "FCEV": 117
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 211456,
        "PHEV": 220006,
        "HEV": 1450417
      },
      "suv_todo_terreno": {
        "BEV": 54,
        "HEV": 424
      },
      "furgoneta_van": {
        "BEV": 51,
        "PHEV": 37182,
        "HEV": 56647
      },
      "moto": {
        "BEV": 36816,
        "PHEV": -31,
        "HEV": 321
      },
      "camion": {
        "BEV": 17709,
        "PHEV": 490,
        "HEV": 8062
      },
      "autobus": {
        "BEV": 2090,
        "PHEV": 3,
        "HEV": 23
      },
      "especial": {
        "BEV": 7370,
        "PHEV": 25,
        "HEV": 453
      },
      "otros": {
        "BEV": 2519,
        "PHEV": 569,
        "HEV": 5517
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
      "BEV": 309061,
      "PHEV": 267638,
      "HEV": 1557231,
      "REEV": 1391,
      "FCEV": 117
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 218435,
        "PHEV": 228412,
        "HEV": 1484761
      },
      "suv_todo_terreno": {
        "BEV": 54,
        "HEV": 431
      },
      "furgoneta_van": {
        "BEV": 54,
        "PHEV": 37856,
        "HEV": 57610
      },
      "moto": {
        "BEV": 35626,
        "PHEV": -33,
        "HEV": 325
      },
      "camion": {
        "BEV": 17942,
        "PHEV": 719,
        "HEV": 8068
      },
      "autobus": {
        "BEV": 2115,
        "PHEV": 3,
        "HEV": 23
      },
      "especial": {
        "BEV": 7459,
        "PHEV": 27,
        "HEV": 458
      },
      "otros": {
        "BEV": 2570,
        "PHEV": 669,
        "HEV": 5551
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
      "BEV": 318524,
      "PHEV": 280979,
      "HEV": 1596540,
      "REEV": 1392,
      "FCEV": 117
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 227306,
        "PHEV": 240737,
        "HEV": 1523206
      },
      "suv_todo_terreno": {
        "BEV": 54,
        "HEV": 436
      },
      "furgoneta_van": {
        "BEV": 59,
        "PHEV": 38432,
        "HEV": 58441
      },
      "moto": {
        "BEV": 35518,
        "PHEV": -33,
        "HEV": 322
      },
      "camion": {
        "BEV": 18237,
        "PHEV": 983,
        "HEV": 8074
      },
      "autobus": {
        "BEV": 2136,
        "PHEV": 3,
        "HEV": 23
      },
      "especial": {
        "BEV": 7555,
        "PHEV": 26,
        "HEV": 473
      },
      "otros": {
        "BEV": 2625,
        "PHEV": 846,
        "HEV": 5561
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
      "BEV": 331328,
      "PHEV": 295018,
      "HEV": 1637076,
      "REEV": 1393,
      "FCEV": 117
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 238487,
        "PHEV": 253672,
        "HEV": 1562878
      },
      "suv_todo_terreno": {
        "BEV": 55,
        "HEV": 439
      },
      "furgoneta_van": {
        "BEV": 65,
        "PHEV": 39136,
        "HEV": 59238
      },
      "moto": {
        "BEV": 35668,
        "PHEV": -34,
        "HEV": 324
      },
      "camion": {
        "BEV": 19242,
        "PHEV": 1173,
        "HEV": 8081
      },
      "autobus": {
        "BEV": 2173,
        "PHEV": 3,
        "HEV": 23
      },
      "especial": {
        "BEV": 7683,
        "PHEV": 28,
        "HEV": 481
      },
      "otros": {
        "BEV": 2730,
        "PHEV": 1055,
        "HEV": 5608
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
      "BEV": 341668,
      "PHEV": 307582,
      "HEV": 1671273,
      "REEV": 1393,
      "FCEV": 117
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 247072,
        "PHEV": 265103,
        "HEV": 1596148
      },
      "suv_todo_terreno": {
        "BEV": 63,
        "HEV": 447
      },
      "furgoneta_van": {
        "BEV": 68,
        "PHEV": 39971,
        "HEV": 60136
      },
      "moto": {
        "BEV": 36185,
        "PHEV": -34,
        "HEV": 325
      },
      "camion": {
        "BEV": 19831,
        "PHEV": 1315,
        "HEV": 8078
      },
      "autobus": {
        "BEV": 2207,
        "PHEV": 3,
        "HEV": 23
      },
      "especial": {
        "BEV": 7818,
        "PHEV": 29,
        "HEV": 486
      },
      "otros": {
        "BEV": 2903,
        "PHEV": 1210,
        "HEV": 5626
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
      "BEV": 349500,
      "PHEV": 315732,
      "HEV": 1692571,
      "REEV": 1400,
      "FCEV": 117
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 253871,
        "PHEV": 272533,
        "HEV": 1616918
      },
      "suv_todo_terreno": {
        "BEV": 64,
        "HEV": 446
      },
      "furgoneta_van": {
        "BEV": 70,
        "PHEV": 40490,
        "HEV": 60594
      },
      "moto": {
        "BEV": 36627,
        "PHEV": -34,
        "HEV": 326
      },
      "camion": {
        "BEV": 20124,
        "PHEV": 1419,
        "HEV": 8103
      },
      "autobus": {
        "BEV": 2226,
        "PHEV": 3,
        "HEV": 24
      },
      "especial": {
        "BEV": 7926,
        "PHEV": 30,
        "HEV": 489
      },
      "otros": {
        "BEV": 2987,
        "PHEV": 1306,
        "HEV": 5667
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
      "BEV": 360246,
      "PHEV": 325755,
      "HEV": 1721026,
      "REEV": 1506,
      "FCEV": 118
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 263513,
        "PHEV": 281677,
        "HEV": 1644700
      },
      "suv_todo_terreno": {
        "BEV": 75,
        "HEV": 448
      },
      "furgoneta_van": {
        "BEV": 74,
        "PHEV": 41033,
        "HEV": 61200
      },
      "moto": {
        "BEV": 36939,
        "PHEV": -34,
        "HEV": 324
      },
      "camion": {
        "BEV": 20572,
        "PHEV": 1586,
        "HEV": 8111
      },
      "autobus": {
        "BEV": 2236,
        "PHEV": 3,
        "HEV": 24
      },
      "especial": {
        "BEV": 8019,
        "PHEV": 31,
        "HEV": 492
      },
      "otros": {
        "BEV": 3085,
        "PHEV": 1474,
        "HEV": 5723
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
      "BEV": 370249,
      "PHEV": 338549,
      "HEV": 1753874,
      "REEV": 1632,
      "FCEV": 119
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 272000,
        "PHEV": 293368,
        "HEV": 1676824
      },
      "suv_todo_terreno": {
        "BEV": 82,
        "HEV": 460
      },
      "furgoneta_van": {
        "BEV": 80,
        "PHEV": 41673,
        "HEV": 61786
      },
      "moto": {
        "BEV": 37520,
        "PHEV": -34,
        "HEV": 324
      },
      "camion": {
        "BEV": 20962,
        "PHEV": 1816,
        "HEV": 8166
      },
      "autobus": {
        "BEV": 2295,
        "PHEV": 3,
        "HEV": 24
      },
      "especial": {
        "BEV": 8158,
        "PHEV": 33,
        "HEV": 511
      },
      "otros": {
        "BEV": 3147,
        "PHEV": 1705,
        "HEV": 5775
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
      "BEV": 380965,
      "PHEV": 350117,
      "HEV": 1784886,
      "REEV": 1764,
      "FCEV": 133
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 280812,
        "PHEV": 303987,
        "HEV": 1707035
      },
      "suv_todo_terreno": {
        "BEV": 90,
        "HEV": 470
      },
      "furgoneta_van": {
        "BEV": 82,
        "PHEV": 42288,
        "HEV": 62495
      },
      "moto": {
        "BEV": 37708,
        "PHEV": -33,
        "HEV": 316
      },
      "camion": {
        "BEV": 21489,
        "PHEV": 2002,
        "HEV": 8166
      },
      "autobus": {
        "BEV": 2336,
        "PHEV": 3,
        "HEV": 24
      },
      "especial": {
        "BEV": 8306,
        "PHEV": 34,
        "HEV": 516
      },
      "otros": {
        "BEV": 3348,
        "PHEV": 1851,
        "HEV": 5860
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
      "BEV": 391274,
      "PHEV": 362189,
      "HEV": 1818166,
      "REEV": 1863,
      "FCEV": 135
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 290630,
        "PHEV": 314967,
        "HEV": 1739688
      },
      "suv_todo_terreno": {
        "BEV": 94,
        "HEV": 475
      },
      "furgoneta_van": {
        "BEV": 93,
        "PHEV": 42889,
        "HEV": 63076
      },
      "moto": {
        "BEV": 37268,
        "PHEV": -33,
        "HEV": 312
      },
      "camion": {
        "BEV": 21893,
        "PHEV": 2241,
        "HEV": 8155
      },
      "autobus": {
        "BEV": 2379,
        "PHEV": 3,
        "HEV": 24
      },
      "especial": {
        "BEV": 8455,
        "PHEV": 34,
        "HEV": 522
      },
      "otros": {
        "BEV": 3493,
        "PHEV": 2103,
        "HEV": 5910
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
      "BEV": 397826,
      "PHEV": 369907,
      "HEV": 1847929,
      "REEV": 1916,
      "FCEV": 135
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 296662,
        "PHEV": 321889,
        "HEV": 1768917
      },
      "suv_todo_terreno": {
        "BEV": 96,
        "HEV": 475
      },
      "furgoneta_van": {
        "BEV": 94,
        "PHEV": 43480,
        "HEV": 63570
      },
      "moto": {
        "BEV": 37044,
        "PHEV": -32,
        "HEV": 312
      },
      "camion": {
        "BEV": 22258,
        "PHEV": 2372,
        "HEV": 8157
      },
      "autobus": {
        "BEV": 2425,
        "PHEV": 3,
        "HEV": 24
      },
      "especial": {
        "BEV": 8536,
        "PHEV": 36,
        "HEV": 528
      },
      "otros": {
        "BEV": 3629,
        "PHEV": 2174,
        "HEV": 5942
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
      "BEV": 406002,
      "PHEV": 381850,
      "HEV": 1888070,
      "REEV": 1983,
      "FCEV": 136
    },
    "parque_por_tipo": {
      "turismo": {
        "BEV": 304888,
        "PHEV": 332800,
        "HEV": 1808510
      },
      "suv_todo_terreno": {
        "BEV": 96,
        "HEV": 476
      },
      "furgoneta_van": {
        "BEV": 96,
        "PHEV": 44183,
        "HEV": 64025
      },
      "moto": {
        "BEV": 35824,
        "PHEV": -30,
        "HEV": 313
      },
      "camion": {
        "BEV": 22858,
        "PHEV": 2500,
        "HEV": 8178
      },
      "autobus": {
        "BEV": 2486,
        "PHEV": 3,
        "HEV": 24
      },
      "especial": {
        "BEV": 8755,
        "PHEV": 38,
        "HEV": 532
      },
      "otros": {
        "BEV": 3732,
        "PHEV": 2371,
        "HEV": 6008
      }
    }
  }
];
