import { Playground } from './Playground'
import { dgtParqueMensual } from '../../../lib/insights/dgt-parque-data'

export default function GeneradorPage() {
  const periodos = dgtParqueMensual.map(p => p.periodo).reverse()
  return <Playground periodos={periodos} />
}
