import { z } from 'zod'

export const parameterSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio'),
    metric: z.enum(['OrderCount', 'DeliveryTypeProportion', 'ZoneCount', 'TotalWeight', 'StopCount']),
    operator: z.enum(['LessThanOrEqual', 'GreaterThanOrEqual', 'Equal']),
    appliedValue: z.number().finite('Indica un valor numérico'),
    deliveryType: z.enum(['Parcel', 'Documents', 'Perishable']).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.metric === 'DeliveryTypeProportion' && !value.deliveryType) {
      ctx.addIssue({
        code: 'custom',
        path: ['deliveryType'],
        message: 'Selecciona el tipo de entrega objetivo',
      })
    }
  })

/** Esquema del formulario de creación de criterios de equilibrio. */
export const balanceCriterionSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  description: z.string().trim().min(1, 'La descripción es obligatoria'),
  customBalancedParameters: z.array(parameterSchema).min(1, 'Agrega al menos un parámetro'),
})

/** Valores inferidos del formulario de criterios. */
export type BalanceCriterionValues = z.infer<typeof balanceCriterionSchema>
