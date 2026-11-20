import { useQuery } from '@tanstack/react-query'
import { MapPin } from 'lucide-react'
import { stopsApi, type Stop } from '../../api/stops.api'

/** Dirección y zona de una parada seleccionada. */
export interface StopSelection {
  address: string
  zoneId: number
}

export interface StopSelectorProps {
  /** Parada actualmente seleccionada (dirección y zona). */
  value: StopSelection
  /** Se invoca al elegir una parada registrada. */
  onChange: (selection: StopSelection, stop: Stop) => void
  /** Identificador del control para asociar una etiqueta. */
  id?: string
  /** Deshabilita la selección. */
  disabled?: boolean
}

/**
 * Selector reutilizable de paradas registradas. Carga las paradas disponibles y
 * permite elegir una para reutilizar su dirección y zona (p. ej. al crear un pedido).
 */
export function StopSelector({ value, onChange, id, disabled }: StopSelectorProps) {
  const stops = useQuery({ queryKey: ['stops'], queryFn: stopsApi.list })

  const selectedId = stops.data?.find(
    (stop) => stop.address === value.address && stop.zoneId === value.zoneId,
  )?.id

  if (stops.isPending) {
    return (
      <div className="mt-1.5 flex h-11 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 text-sm text-neutral-500">
        <MapPin className="h-4 w-4" /> Cargando paradas…
      </div>
    )
  }

  if (stops.isError) {
    return (
      <div className="mt-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
        No se pudieron cargar las paradas.
      </div>
    )
  }

  const items = stops.data ?? []

  return (
    <select
      id={id}
      disabled={disabled || items.length === 0}
      value={selectedId ?? ''}
      onChange={(event) => {
        const stop = items.find((candidate) => candidate.id === Number(event.target.value))
        if (stop) onChange({ address: stop.address, zoneId: stop.zoneId }, stop)
      }}
      className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 font-normal outline-none focus:border-neutral-500 disabled:bg-neutral-50"
    >
      <option value="" disabled>
        {items.length === 0 ? 'No hay paradas registradas' : 'Selecciona una parada'}
      </option>
      {items.map((stop) => (
        <option key={stop.id} value={stop.id}>
          {stop.zoneName} · {stop.address}
        </option>
      ))}
    </select>
  )
}
