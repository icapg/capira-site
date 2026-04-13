import json, requests

TOKEN = ""  # set via env var NOTION_TOKEN
PAGE_ID = "34032eb8-6ee6-8069-9d9d-c517bb2509a8"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

# 1. Delete all existing blocks
resp = requests.get(f"https://api.notion.com/v1/blocks/{PAGE_ID}/children?page_size=100", headers=HEADERS)
blocks = resp.json().get("results", [])
print(f"Deleting {len(blocks)} blocks...")
for b in blocks:
    r = requests.delete(f"https://api.notion.com/v1/blocks/{b['id']}", headers=HEADERS)
    if r.status_code not in (200, 404):
        print(f"  WARN {b['id']}: {r.status_code}")
print("Done deleting.")

# 2. Field data
mat_fields = [
    ("FEC_MATRICULA",      "✅", "Fecha exacta de matriculacion",                              "20240115",        "Eje temporal (mes/año)"),
    ("COD_CLASE_MAT",      "❌", "Codigo interno del tramite administrativo",                  "1",               "Sin valor analitico"),
    ("MARCA_ITV",          "✅", "Marca del vehiculo segun ficha ITV",                         "TESLA",           "Top marcas BEV/PHEV"),
    ("MODELO_ITV",         "✅", "Modelo del vehiculo",                                        "MODEL 3",         "Top modelos"),
    ("COD_TIPO",           "⚠️", "Codigo interno DGT del tipo de vehiculo",                   "01",              "Util para depurar cat_homologacion"),
    ("COD_PROPULSION",     "❌", "Codigo combustible DGT",                                     "E",               "Reemplazado por CAT_VEHICULO_EV"),
    ("CILINDRADA_ITV",     "❌", "Cilindrada del motor en cc",                                 "0",               "Siempre 0 en BEV"),
    ("POTENCIA_ITV",       "❌", "Potencia en CV",                                             "283",             "Redundante con KW_ITV"),
    ("TARA",               "❌", "Peso del vehiculo en vacio en kg",                           "1850",            "Sin valor para dashboard"),
    ("PESO_MAX",           "❌", "Peso maximo autorizado en kg",                               "2230",            "Sin valor para dashboard"),
    ("NUM_PLAZAS_ITV",     "❌", "Numero de plazas segun ITV",                                 "5",               "Sin valor para dashboard"),
    ("COD_PROVINCIA_VEH",  "⚠️", "Provincia de domicilio del propietario",                    "28",              "Alternativa a COD_PROVINCIA_MAT"),
    ("COD_PROVINCIA_MAT",  "✅", "Provincia donde se tramito la matriculacion",                "08",              "Distribucion geografica"),
    ("IND_NUEVO_USADO",    "✅", "N=nuevo, U=usado o importado",                               "N",               "Filtrar solo ventas nuevas"),
    ("PERSONA_FIS_JUR",    "✅", "F=persona fisica (particular), J=juridica (empresa)",        "F",               "% empresa vs particular"),
    ("SERVICIO",           "⚠️", "Tipo de uso: privado, taxi, alquiler...",                   "SERVICIO PRIVADO","Podria usarse para excluir flotas"),
    ("MUNICIPIO",          "⚠️", "Municipio de matriculacion",                                "MADRID",          "Demasiado granular, mejor provincia"),
    ("KW_ITV",             "✅", "Potencia del motor electrico en kW",                         "283",             "Buckets de potencia (<100, 100-150...)"),
    ("NUM_PLAZAS_MAX",     "❌", "Plazas maximas homologadas",                                 "5",               "Sin valor para dashboard"),
    ("CO2_ITV",            "❌", "Emisiones CO2 en g/km",                                      "0",               "Siempre 0 en BEV"),
    ("RENTING",            "✅", "Indica si el vehiculo es de renting (S/N)",                  "S",               "% renting vs compra directa"),
    ("FEC_PRIM_MATRICULAC","⚠️", "Fecha de primera matriculacion (=FEC_MATRICULA en nuevos)", "20240115",        "Util en analisis de usados"),
    ("CODIGO_POSTAL",      "❌", "Codigo postal de matriculacion",                             "28001",           "Demasiado granular"),
    ("FABRICANTE_ITV",     "⚠️", "Grupo fabricante holding",                                  "VOLKSWAGEN AG",   "Opcional: analisis por grupo"),
    ("MASA_ORDEN_MARCHA",  "❌", "Masa del vehiculo en orden de marcha en kg",                 "1960",            "Sin valor para dashboard"),
    ("MASA_MAX_TECNICA",   "❌", "Masa maxima tecnicamente admisible en kg",                   "2350",            "Sin valor para dashboard"),
    ("CAT_HOMOLOGACION_EU","✅", "Categoria EU: M1=turismo, N1=furgoneta, L=moto",             "M1",              "Separar turismos de furgonetas y motos"),
    ("CARROCERIA",         "⚠️", "Tipo de carroceria",                                        "TURISMO",         "Posible sustituto de cat_homologacion"),
    ("NIVEL_EMISION_EURO", "✅", "Norma Euro de emisiones",                                    "EURO 6",          "Verificar calidad dato EV"),
    ("CONSUMO_WH_KM",      "✅", "Consumo electrico en Wh/km segun homologacion",              "159",             "Eficiencia energetica — buckets"),
    ("CAT_VEHICULO_EV",    "✅", "BEV, PHEV, HEV, REEV, FCEV — campo clave",                  "BEV",             "Filtro principal del dashboard"),
    ("AUTONOMIA_EV",       "✅", "Autonomia electrica homologada en km",                        "491",             "Buckets (<200, 200-300, 300-400, 400+)"),
    ("TIPO_ALIMENTACION",  "⚠️", "Tecnologia de bateria/alimentacion",                        "LITIO",           "Posible filtro futuro"),
]

baj_fields = [
    ("FEC_BAJA",            "✅", "Fecha exacta de la baja del vehiculo",                      "20240301",        "Eje temporal de bajas"),
    ("MARCA_ITV",           "✅", "Marca del vehiculo dado de baja",                           "NISSAN",          "Bajas por marca"),
    ("MODELO_ITV",          "✅", "Modelo del vehiculo dado de baja",                          "LEAF",            "Bajas por modelo"),
    ("COD_TIPO",            "⚠️", "Codigo tipo vehiculo DGT",                                  "01",              "Util para depurar cat_homologacion"),
    ("COD_PROPULSION",      "❌", "Codigo combustible DGT",                                    "E",               "Reemplazado por CAT_VEHICULO_EV"),
    ("CILINDRADA_ITV",      "❌", "Cilindrada en cc",                                          "0",               "Siempre 0 en BEV"),
    ("POTENCIA_ITV",        "❌", "Potencia en CV",                                            "80",              "Redundante con KW_ITV"),
    ("TARA",                "❌", "Peso en vacio en kg",                                       "1525",            "Sin valor para dashboard"),
    ("PESO_MAX",            "❌", "Peso maximo en kg",                                         "1880",            "Sin valor para dashboard"),
    ("NUM_PLAZAS_ITV",      "❌", "Numero de plazas",                                          "5",               "Sin valor para dashboard"),
    ("COD_PROVINCIA_VEH",   "⚠️", "Provincia de domicilio del propietario",                   "28",              "Alternativa a COD_PROVINCIA_MAT"),
    ("COD_PROVINCIA_MAT",   "✅", "Provincia donde se tramito la baja",                        "08",              "Distribucion geografica de bajas"),
    ("MOTIVO_BAJA",         "✅", "Causa de la baja: exportacion, siniestro, etc.",             "EXPORTACION",     "Exportaciones vs destrucciones"),
    ("FEC_PRIM_MATRICULAC", "✅", "Fecha de primera matriculacion — permite calcular edad",    "20180601",        "Vida util media de los EV"),
    ("PERSONA_FIS_JUR",     "✅", "F=particular, J=empresa",                                   "F",               "Quien da de baja mas EV"),
    ("SERVICIO",            "⚠️", "Tipo de uso del vehiculo",                                  "SERVICIO PRIVADO","Contexto de la baja"),
    ("MUNICIPIO",           "⚠️", "Municipio de baja",                                        "MADRID",          "Demasiado granular"),
    ("KW_ITV",              "✅", "Potencia en kW del vehiculo dado de baja",                  "80",              "Perfil de potencia de EV dados de baja"),
    ("CO2_ITV",             "❌", "Emisiones CO2 en g/km",                                     "0",               "Siempre 0 en BEV"),
    ("FABRICANTE_ITV",      "⚠️", "Grupo fabricante holding",                                 "RENAULT-NISSAN",  "Opcional"),
    ("CAT_HOMOLOGACION_EU", "✅", "Categoria EU: M1, N1, L...",                                "M1",              "Separar tipos de vehiculo"),
    ("CARROCERIA",          "⚠️", "Tipo de carroceria",                                        "TURISMO",         "Posible sustituto de cat_homologacion"),
    ("NIVEL_EMISION_EURO",  "✅", "Norma Euro del vehiculo dado de baja",                      "EURO 6",          "Antiguedad tecnologica"),
    ("CAT_VEHICULO_EV",     "✅", "BEV, PHEV, HEV, etc.",                                      "BEV",             "Filtro principal"),
    ("AUTONOMIA_EV",        "✅", "Autonomia del vehiculo dado de baja en km",                 "226",             "Comparar autonomia de bajas vs nuevos"),
]

def cell(text):
    return [{"type": "text", "text": {"content": text}}]

def make_table(fields):
    rows = [{
        "object": "block",
        "type": "table_row",
        "table_row": {"cells": [cell("Campo"), cell("Estado"), cell("Descripcion"), cell("Ejemplo"), cell("Uso en dashboard")]}
    }]
    for f in fields:
        rows.append({
            "object": "block",
            "type": "table_row",
            "table_row": {"cells": [cell(f[0]), cell(f[1]), cell(f[2]), cell(f[3]), cell(f[4])]}
        })
    return {
        "object": "block",
        "type": "table",
        "table": {
            "table_width": 5,
            "has_column_header": True,
            "has_row_header": False,
            "children": rows
        }
    }

def h2(text):
    return {"object": "block", "type": "heading_2",
            "heading_2": {"rich_text": [{"type": "text", "text": {"content": text}}]}}

def para(text):
    return {"object": "block", "type": "paragraph",
            "paragraph": {"rich_text": [{"type": "text", "text": {"content": text}}]}}

# 3. Add new content
children = [
    h2("Matriculaciones — 33 campos"),
    para("✅ Usar   ⚠️ Opcional / bajo valor   ❌ Descartar"),
    make_table(mat_fields),
    h2("Bajas — 25 campos"),
    make_table(baj_fields),
]

resp = requests.patch(
    f"https://api.notion.com/v1/blocks/{PAGE_ID}/children",
    headers=HEADERS,
    json={"children": children}
)
if resp.status_code == 200:
    print("Tables created successfully!")
else:
    print(f"ERROR {resp.status_code}: {resp.text[:800]}")
