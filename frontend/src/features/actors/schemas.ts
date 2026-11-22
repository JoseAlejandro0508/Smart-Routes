import { z } from 'zod'

function isAdult(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const m = today.getMonth() - date.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--
  return age >= 18
}

/** Esquema para crear un repartidor con cuenta de usuario. */
export const deliveryPersonSchema = z.object({
  email: z.string().trim().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().trim().min(1, 'El nombre es obligatorio'),
  lastName: z.string().trim().min(1, 'Los apellidos son obligatorios'),
  birthDay: z.string().min(1, 'La fecha de nacimiento es obligatoria').refine(isAdult, 'El repartidor debe tener al menos 18 años'),
  fleet: z.string().trim().min(1, 'La flota es obligatoria'),
  distributionCenterIds: z.array(z.number().int().positive()),
})

export type DeliveryPersonFormValues = z.infer<typeof deliveryPersonSchema>

/** Esquema para crear un coordinador logístico. */
export const coordinatorSchema = z.object({
  email: z.string().trim().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().trim().min(1, 'El nombre es obligatorio'),
  lastName: z.string().trim().min(1, 'Los apellidos son obligatorios'),
  specialty: z.string().trim().min(1, 'La especialidad es obligatoria'),
  authorizedCenterIds: z.array(z.number().int().positive()),
})

export type CoordinatorFormValues = z.infer<typeof coordinatorSchema>

/** Esquema para crear un supervisor de operaciones. */
export const supervisorSchema = z.object({
  email: z.string().trim().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().trim().min(1, 'El nombre es obligatorio'),
  lastName: z.string().trim().min(1, 'Los apellidos son obligatorios'),
  controlArea: z.string().trim().min(1, 'El área de control es obligatoria'),
})

export type SupervisorFormValues = z.infer<typeof supervisorSchema>
