import { useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Gauge, Plus, Save, Trash2, X } from 'lucide-react'
import {
  balanceCriteriaApi,
  type BalanceCriterion,
  type BalanceMetric,
  type ComparisonOperator,
} from '../api/balance-criteria.api'
import { getApiErrorMessage } from '../api/http'
import type { DeliveryType } from '../api/orders.api'
import {
  balanceCriterionSchema,
  type BalanceCriterionValues,
} from '../features/balance-criteria/schemas'

const metricLabels: Record<BalanceMetric, string> = {
  OrderCount: 'Cantidad de pedidos',
  DeliveryTypeProportion: 'Proporción por tipo de entrega',
  ZoneCount: 'Cantidad de zonas',
  TotalWeight: 'Peso total',
  StopCount: 'Cantidad de paradas',
}

const operatorLabels: Record<ComparisonOperator, string> = {
  LessThanOrEqual: 'Menor o igual (<=)',
  GreaterThanOrEqual: 'Mayor o igual (>=)',
  Equal: 'Igual (=)',
}

const deliveryTypeLabels: Record<DeliveryType, string> = {
  Parcel: 'Paquetería',
  Documents: 'Documentos',
  Perishable: 'Perecederos',
}

const emptyParameter = {
  name: '',
  metric: 'OrderCount' as BalanceMetric,
  operator: 'GreaterThanOrEqual' as ComparisonOperator,
  appliedValue: 1,
  deliveryType: undefined as DeliveryType | undefined,
}

/** Pantalla de gestión de criterios de equilibrio para la generación de rutas. */
export function CriteriosPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [actionError, setActionError] = useState('')

  const criteria = useQuery({ queryKey: ['balance-criteria'], queryFn: balanceCriteriaApi.list })

  const form = useForm<BalanceCriterionValues>({
    resolver: zodResolver(balanceCriterionSchema),
    defaultValues: {
      name: '',
      description: '',
      customBalancedParameters: [emptyParameter],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'customBalancedParameters',
  })

  const watchedParameters = useWatch({ control: form.control, name: 'customBalancedParameters' })

  const createCriterion = useMutation({
    mutationFn: balanceCriteriaApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['balance-criteria'] })
      form.reset({ name: '', description: '', customBalancedParameters: [emptyParameter] })
      setFormOpen(false)
      setActionError('')
    },
    onError: (error) => setActionError(getApiErrorMessage(error, 'No se pudo crear el criterio.')),
  })

  const deleteCriterion = useMutation({
    mutationFn: balanceCriteriaApi.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['balance-criteria'] })
      setActionError('')
    },
    onError: (error) => setActionError(getApiErrorMessage(error, 'No se pudo eliminar el criterio.')),
  })

  function submit(values: BalanceCriterionValues) {
    setActionError('')
    createCriterion.mutate({
      name: values.name,
      description: values.description,
      customBalancedParameters: values.customBalancedParameters.map((parameter) => ({
        name: parameter.name,
        metric: parameter.metric,
        operator: parameter.operator,
        appliedValue: parameter.appliedValue,
        ...(parameter.metric === 'DeliveryTypeProportion' && parameter.deliveryType
          ? { deliveryType: parameter.deliveryType }
          : {}),
      })),
    })
  }

  function parameterSummary(criterion: BalanceCriterion) {
    return criterion.parameters
      .map((parameter) => {
        const base = `${parameter.name}: ${metricLabels[parameter.metric]} ${operatorLabels[parameter.operator]} ${parameter.appliedValue}`
        return parameter.targetDeliveryType
          ? `${base} (${deliveryTypeLabels[parameter.targetDeliveryType]})`
          : base
      })
      .join(' · ')
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">Planificación</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Criterios de equilibrio</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Define criterios con parámetros medibles para generar rutas equilibradas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((open) => !open)}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          {formOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {formOpen ? 'Cerrar formulario' : 'Nuevo criterio'}
        </button>
      </header>

      {actionError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </p>
      )}

      {formOpen && (
        <form onSubmit={form.handleSubmit(submit)} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-2">
            <Gauge className="h-5 w-5 text-neutral-500" />
            <h2 className="font-semibold text-neutral-900">Crear criterio</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-neutral-700">
              Nombre
              <input
                {...form.register('name')}
                className="mt-1.5 h-11 w-full rounded-lg border border-neutral-200 px-3.5 font-normal shadow-sm outline-none focus:border-neutral-500"
                placeholder="Equilibrio urbano"
              />
              {form.formState.errors.name && (
                <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.name.message}</span>
              )}
            </label>

            <label className="text-sm font-medium text-neutral-700 md:col-span-2">
              Descripción
              <textarea
                {...form.register('description')}
                className="mt-1.5 min-h-24 w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 font-normal shadow-sm outline-none focus:border-neutral-500"
                placeholder="Describe el objetivo del criterio"
              />
              {form.formState.errors.description && (
                <span className="mt-1 block text-xs text-rose-600">{form.formState.errors.description.message}</span>
              )}
            </label>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">Parámetros</h3>
              <button
                type="button"
                onClick={() => append(emptyParameter)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar parámetro
              </button>
            </div>

            {form.formState.errors.customBalancedParameters?.root && (
              <p className="text-xs text-rose-600">
                {form.formState.errors.customBalancedParameters.root.message}
              </p>
            )}

            {fields.map((field, index) => {
              const metric = watchedParameters?.[index]?.metric
              return (
                <div key={field.id} className="rounded-xl border border-neutral-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-neutral-800">Parámetro {index + 1}</p>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50"
                        aria-label={`Eliminar parámetro ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-sm font-medium text-neutral-700 md:col-span-2">
                      Nombre
                      <input
                        {...form.register(`customBalancedParameters.${index}.name`)}
                        className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 font-normal outline-none focus:border-neutral-500"
                      />
                    </label>

                    <label className="text-sm font-medium text-neutral-700">
                      Métrica
                      <select
                        {...form.register(`customBalancedParameters.${index}.metric`)}
                        className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 font-normal outline-none focus:border-neutral-500"
                      >
                        {Object.entries(metricLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm font-medium text-neutral-700">
                      Operador
                      <select
                        {...form.register(`customBalancedParameters.${index}.operator`)}
                        className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 font-normal outline-none focus:border-neutral-500"
                      >
                        {Object.entries(operatorLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm font-medium text-neutral-700">
                      Valor aplicado
                      <input
                        type="number"
                        step="any"
                        {...form.register(`customBalancedParameters.${index}.appliedValue`, { valueAsNumber: true })}
                        className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 font-normal outline-none focus:border-neutral-500"
                      />
                    </label>

                    {metric === 'DeliveryTypeProportion' && (
                      <label className="text-sm font-medium text-neutral-700">
                        Tipo de entrega objetivo
                        <select
                          {...form.register(`customBalancedParameters.${index}.deliveryType`)}
                          className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 font-normal outline-none focus:border-neutral-500"
                        >
                          <option value="">Selecciona un tipo</option>
                          {Object.entries(deliveryTypeLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        {form.formState.errors.customBalancedParameters?.[index]?.deliveryType && (
                          <span className="mt-1 block text-xs text-rose-600">
                            {form.formState.errors.customBalancedParameters[index]?.deliveryType?.message}
                          </span>
                        )}
                      </label>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="submit"
            disabled={createCriterion.isPending}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {createCriterion.isPending ? 'Guardando…' : 'Crear criterio'}
          </button>
        </form>
      )}

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-4">
          <h2 className="font-semibold text-neutral-900">Criterios disponibles</h2>
        </div>

        {criteria.isPending ? (
          <p className="p-8 text-center text-sm text-neutral-500">Cargando criterios…</p>
        ) : criteria.isError ? (
          <p className="p-8 text-center text-sm text-rose-600">No se pudieron cargar los criterios.</p>
        ) : (criteria.data ?? []).length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">Aún no hay criterios registrados.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {(criteria.data ?? []).map((criterion) => (
              <li key={criterion.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-neutral-900">{criterion.name}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          criterion.isPredefined
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {criterion.isPredefined ? 'Preestablecido' : 'Creado por coordinador'}
                      </span>
                    </div>
                    {criterion.description && (
                      <p className="mt-1 text-sm text-neutral-500">{criterion.description}</p>
                    )}
                    <p className="mt-2 text-xs text-neutral-500">{parameterSummary(criterion)}</p>
                  </div>

                  {!criterion.isPredefined && (
                    <button
                      type="button"
                      disabled={deleteCriterion.isPending}
                      onClick={() => deleteCriterion.mutate(criterion.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
