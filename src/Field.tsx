import { cloneElement, type ReactElement } from 'react'

export function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactElement<{ id?: string; className?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>
}) {
  return (
    <label htmlFor={id}>
      <span>{label}</span>
      {cloneElement(children, {
        id,
        className: error ? 'input-invalid' : undefined,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? `${id}-error` : undefined,
      })}
      {error ? (
        <small id={`${id}-error`} className="field-error">
          {error}
        </small>
      ) : null}
    </label>
  )
}
