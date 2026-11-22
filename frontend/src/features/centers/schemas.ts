// src/features/centers/schemas.ts
import { z } from 'zod'

const optionalLatitude = z
  .number()
  .min(-90, 'La latitud debe estar entre -90 y 90')
  .max(90, 'La latitud debe estar entre -90 y 90')
  .optional()

const optionalLongitude = z
  .number()
  .min(-180, 'La longitud debe estar entre -180 y 180')
  .max(180, 'La longitud debe estar entre -180 y 180')
  .optional()

/** Esquema del formulario de centros de distribución. */
export const centerSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio').max(200, 'Máximo 200 caracteres'),
    logisticsProgram: z.string().trim().min(1, 'El programa logístico es obligatorio').max(200, 'Máximo 200 caracteres'),
    latitude: optionalLatitude,
    longitude: optionalLongitude,
    coveredZoneIds: z.array(z.number()).min(1, 'Selecciona al menos una zona'),
  })
  .refine(
    (values) => (values.latitude === undefined) === (values.longitude === undefined),
    {
      message: 'Indica latitud y longitud juntas, o deja ambas vacías',
      path: ['latitude'],
    },
  )

/** Valores inferidos del formulario de centros. */
export type CenterValues = z.infer<typeof centerSchema>

/** Esquema del formulario de zonas. */
export const zoneSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(200, 'Máximo 200 caracteres'),
})

/** Valores inferidos del formulario de zonas. */
export type ZoneValues = z.infer<typeof zoneSchema>
