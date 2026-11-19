// src/components/auth/PasswordStrength.tsx
import { passwordChecks, PASSWORD_CHECK_LABELS } from '../../features/auth/schemas'

const BAR_COLORS = ['bg-neutral-300', 'bg-rose-500', 'bg-orange-500', 'bg-yellow-400', 'bg-emerald-500']

export function PasswordStrength({ password }: { password: string }) {
  const checks = passwordChecks(password)
  const score = Object.values(checks).filter(Boolean).length // 0..4

  return (
    <div className="flex flex-col gap-2 text-xs text-neutral-500">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < score ? BAR_COLORS[score] : 'bg-neutral-200'}`} />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-1">
        {(Object.keys(PASSWORD_CHECK_LABELS) as Array<keyof typeof PASSWORD_CHECK_LABELS>).map((key) => (
          <li key={key} className={checks[key] ? 'text-emerald-600' : ''}>
            {checks[key] ? '✓' : '○'} {PASSWORD_CHECK_LABELS[key]}
          </li>
        ))}
      </ul>
    </div>
  )
}