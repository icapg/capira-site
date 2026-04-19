import type { ComponentType } from 'react'
import type { TipoVehiculo } from '../insights/dgt-bev-phev-data'
import { MatriculacionesMes } from '../../insights/social/templates/MatriculacionesMes'
import { BajasMes }           from '../../insights/social/templates/BajasMes'
import { AcumuladoMes }       from '../../insights/social/templates/AcumuladoMes'
import { getTemplateDataFor } from './monthly'

export type FilterId = 'periodo' | 'tec' | 'tipoVehiculo' | 'fuente'

export type ImageFilters = {
  periodoKey:    string                                       // 'YYYY-MM'
  tec:           'ambos' | 'bev' | 'phev'
  tiposVehiculo: TipoVehiculo[]
  fuente:        'dgt' | 'anfac'
}

export type ImageTypeDef = {
  id:              string
  label:           string
  category:        'mensual' | 'anual' | 'comparativa' | 'otro'
  description:     string
  supports:        FilterId[]                                // filtros que el tipo realmente aplica
  render:          (filters: ImageFilters) => React.ReactElement | null
}

/**
 * getTemplateDataFor devuelve null cuando no hay datos DGT para el periodo.
 * Los 3 tipos actuales ignoran tec/tipoVehiculo/fuente — la UI los muestra grises.
 */
function renderMatri(filters: ImageFilters) {
  const d = getTemplateDataFor(filters.periodoKey)
  if (!d) return null
  return (
    <MatriculacionesMes
      periodo={d.periodo}
      periodoFull={d.periodoFull}
      periodoPrev={d.periodoPrev}
      periodoPrevFull={d.periodoPrevFull}
      {...d.matriculaciones}
    />
  )
}

function renderBajas(filters: ImageFilters) {
  const d = getTemplateDataFor(filters.periodoKey)
  if (!d) return null
  return (
    <BajasMes
      periodo={d.periodo}
      periodoFull={d.periodoFull}
      periodoPrev={d.periodoPrev}
      periodoPrevFull={d.periodoPrevFull}
      {...d.bajas}
    />
  )
}

function renderAcumulado(filters: ImageFilters) {
  const d = getTemplateDataFor(filters.periodoKey)
  if (!d) return null
  return (
    <AcumuladoMes
      periodo={d.periodo}
      periodoFull={d.periodoFull}
      periodoPrevFull={d.periodoPrevFull}
      {...d.acumulado}
    />
  )
}

export const IMAGE_TYPES: ImageTypeDef[] = [
  {
    id:           'matriculaciones-mes',
    label:        'Matriculaciones del mes',
    category:     'mensual',
    description:  'BEV · PHEV · No enchufable del mes, con YoY y penetración.',
    supports:     ['periodo'],
    render:       renderMatri,
  },
  {
    id:           'bajas-mes',
    label:        'Bajas del mes',
    category:     'mensual',
    description:  'Vehículos dados de baja ese mes, desglose BEV/PHEV/No ench.',
    supports:     ['periodo'],
    render:       renderBajas,
  },
  {
    id:           'parque-activo',
    label:        'Parque EV activo',
    category:     'mensual',
    description:  'Penetración sobre parque total y composición BEV/PHEV activos.',
    supports:     ['periodo'],
    render:       renderAcumulado,
  },
]

export function imageTypeById(id: string): ImageTypeDef | undefined {
  return IMAGE_TYPES.find(t => t.id === id)
}

export const ALL_FILTERS: FilterId[] = ['periodo', 'tec', 'tipoVehiculo', 'fuente']
