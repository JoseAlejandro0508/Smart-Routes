// src/features/auth/schemas.ts
import { z } from 'zod'

// ── Reglas de contraseña: compartidas entre esquema y UI ────
// En Zod 4 los formatos de string viven en el nivel superior
// (z.email(), no z.string().email() como en v3).
/** Esquema de validación para el formulario de inicio de sesión. */
export const loginSchema = z.object({
  email: z.email('Escribe un correo válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
  remember: z.boolean(),
})

/** Valores inferidos del formulario de inicio de sesión. */
export type LoginValues = z.infer<typeof loginSchema>

// ── Chequeos de fortaleza (los usará el medidor y el registro) ──
/** Calcula los indicadores de fortaleza para una contraseña. */
export const passwordChecks = (pw: string) => ({
  minLength: pw.length >= 8,
  hasUppercase: /[A-Z]/.test(pw),
  hasNumber: /\d/.test(pw),
  hasSymbol: /[^A-Za-z0-9]/.test(pw),
})

/** Etiquetas visibles para cada indicador de fortaleza de contraseña. */
export const PASSWORD_CHECK_LABELS = {
  minLength: '8+ caracteres',
  hasUppercase: 'Una mayúscula',
  hasNumber: 'Un número',
  hasSymbol: 'Un símbolo',
} as const

/** Claves de los indicadores de fortaleza de contraseña. */
export type PasswordCheckKey = keyof typeof PASSWORD_CHECK_LABELS

// Esquema de registro ya preparado (lo usaremos en el Paso 6):
// superRefine ejecuta las reglas COMPLEJAS tras validar las simples.
/** Esquema de validación para el formulario de registro. */
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

/** Valores inferidos del formulario de registro. */
export type RegisterValues = z.infer<typeof registerSchema>

/** Esquema de validación para solicitar recuperación de contraseña. */
export const forgotSchema = z.object({
  email: z.email('Escribe un correo válido'),
})
/** Valores inferidos del formulario de recuperación de contraseña. */
export type ForgotValues = z.infer<typeof forgotSchema>

/** Esquema de validación para restablecer la contraseña con un token. */
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

/** Esquema de validación para cambiar la contraseña desde el perfil. */
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
/** Valores inferidos del formulario de cambio de contraseña. */
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
/** Valores inferidos del formulario de restablecimiento de contraseña. */
export type ResetValues = z.infer<typeof resetSchema>