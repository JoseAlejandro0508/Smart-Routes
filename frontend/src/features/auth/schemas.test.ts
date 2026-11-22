import { describe, expect, it } from 'vitest'
import {
  changePasswordSchema,
  loginSchema,
  passwordChecks,
  registerSchema,
  resetSchema,
} from './schemas'

describe('loginSchema', () => {
  it('acepta credenciales válidas', () => {
    expect(
      loginSchema.safeParse({
        email: 'ana@smartroutes.test',
        password: 'secreta',
        remember: true,
      }).success,
    ).toBe(true)
  })

  it('rechaza correo inválido y contraseña vacía', () => {
    const result = loginSchema.safeParse({ email: 'no-es-correo', password: '', remember: false })
    expect(result.success).toBe(false)
    const fields = result.error?.issues.map((issue) => issue.path.join('.')) ?? []
    expect(fields).toContain('email')
    expect(fields).toContain('password')
  })
})

describe('registerSchema', () => {
  const valid = {
    name: 'Ana Pérez',
    email: 'ana@smartroutes.test',
    password: 'Password1!',
    confirmPassword: 'Password1!',
    acceptTerms: true,
  }

  it('acepta un registro completo', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('exige aceptar los términos', () => {
    const result = registerSchema.safeParse({ ...valid, acceptTerms: false })
    expect(result.success).toBe(false)
    expect(result.error?.issues.some((issue) => issue.path.includes('acceptTerms'))).toBe(true)
  })

  it('señala la confirmación cuando las contraseñas no coinciden', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'Otra1!' })
    expect(result.success).toBe(false)
    expect(result.error?.issues.some((issue) => issue.path.includes('confirmPassword'))).toBe(true)
  })
})

describe('resetSchema', () => {
  it('acepta contraseñas iguales', () => {
    expect(resetSchema.safeParse({ password: 'Password1!', confirmPassword: 'Password1!' }).success).toBe(
      true,
    )
  })

  it('rechaza contraseñas distintas', () => {
    const result = resetSchema.safeParse({ password: 'Password1!', confirmPassword: 'Password2!' })
    expect(result.success).toBe(false)
    expect(result.error?.issues.some((issue) => issue.path.includes('confirmPassword'))).toBe(true)
  })
})

describe('changePasswordSchema', () => {
  it('acepta una contraseña nueva válida y distinta', () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'Actual1!',
        password: 'Nueva1!x',
        confirmPassword: 'Nueva1!x',
      }).success,
    ).toBe(true)
  })

  it('rechaza repetir la contraseña actual', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'Misma1!',
      password: 'Misma1!',
      confirmPassword: 'Misma1!',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues.some((issue) => issue.path.includes('password'))).toBe(true)
  })
})

describe('passwordChecks', () => {
  it('evalúa longitud, mayúscula, número y símbolo', () => {
    expect(passwordChecks('abc')).toEqual({
      minLength: false,
      hasUppercase: false,
      hasNumber: false,
      hasSymbol: false,
    })
    expect(passwordChecks('Password1!')).toEqual({
      minLength: true,
      hasUppercase: true,
      hasNumber: true,
      hasSymbol: true,
    })
  })
})
