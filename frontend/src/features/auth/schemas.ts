// src/features/auth/schemas.ts
import { z } from 'zod'

// ── Reglas de contraseña: compartidas entre esquema y UI ────
// En Zod 4 los formatos de string viven en el nivel superior
// (z.email(), no z.string().email() como en v3).
export const loginSchema = z.object({
  email: z.email('Escribe un correo válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
  remember: z.boolean(),
})

// El tipo se DERIVA del esquema: si mañana añades un campo al
// esquema, el tipo se actualiza solo. Cero duplicación.
export type LoginValues = z.infer<typeof loginSchema>

// ── Chequeos de fortaleza (los usará el medidor y el registro) ──
export const passwordChecks = (pw: string) => ({
  minLength: pw.length >= 8,
  hasUppercase: /[A-Z]/.test(pw),
  hasNumber: /\d/.test(pw),
  hasSymbol: /[^A-Za-z0-9]/.test(pw),
})

export const PASSWORD_CHECK_LABELS = {
  minLength: '8+ caracteres',
  hasUppercase: 'Una mayúscula',
  hasNumber: 'Un número',
  hasSymbol: 'Un símbolo',
} as const

export type PasswordCheckKey = keyof typeof PASSWORD_CHECK_LABELS

// Esquema de registro ya preparado (lo usaremos en el Paso 6):
// superRefine ejecuta las reglas COMPLEJAS tras validar las simples.
export const registerSchema = z
  .object({
    name: z.string().min(2, 'Cuéntanos tu nombre (mín. 2 letras)'),
    email: z.email('Escribe un correo válido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    acceptTerms: z.boolean().refine((v) => v, 'Debes aceptar los términos'),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      // Un error de esquema puede apuntar a CUALQUIER campo
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Las contraseñas no coinciden',
      })
    }
  })

  export type RegisterValues = z.infer<typeof registerSchema>

  export const forgotSchema = z.object({
  email: z.email('Escribe un correo válido'),
})
export type ForgotValues = z.infer<typeof forgotSchema>

export const resetSchema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .superRefine((v, ctx) => {
    if (v.password !== v.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Las contraseñas no coinciden',
      })
    }
  })

  export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Escribe tu contraseña actual'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .superRefine((v, ctx) => {
    if (v.password === v.currentPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'La nueva debe ser distinta de la actual',
      })
    }
    if (v.password !== v.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Las contraseñas no coinciden',
      })
    }
  })
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
export type ResetValues = z.infer<typeof resetSchema>