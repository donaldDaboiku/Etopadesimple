import { monthCells, monthLabel, WEEKDAY_LABELS } from './availability.ts'
import { formatLongDate } from './format.ts'

type MonthCalendarProps = {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
  prevDisabled?: boolean
  nextDisabled?: boolean
  dayHint?: (date: string) => string
  dayDisabled: (date: string, inMonth: boolean) => boolean
  dayPressed: (date: string) => boolean
  dayClass: (date: string, inMonth: boolean) => string
  onPick: (date: string) => void
}

export function MonthCalendar({
  year,
  month,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  dayHint,
  dayDisabled,
  dayPressed,
  dayClass,
  onPick,
}: MonthCalendarProps) {
  const label = monthLabel(year, month)
  return (
    <div className="calendar" role="group" aria-label={label}>
      <div className="calendar-nav">
        <button type="button" className="secondary-button btn-sm" onClick={onPrev} disabled={prevDisabled} aria-label="Previous month">
          Prev
        </button>
        <strong>{label}</strong>
        <button type="button" className="secondary-button btn-sm" onClick={onNext} disabled={nextDisabled} aria-label="Next month">
          Next
        </button>
      </div>
      <div className="calendar-grid">
        {WEEKDAY_LABELS.map((name) => (
          <span key={name} className="calendar-dow" aria-hidden="true">
            {name}
          </span>
        ))}
        {monthCells(year, month).map((cell) => {
          if (!cell.inMonth) {
            return (
              <button type="button" key={cell.date} className="day-button outside" aria-hidden="true" tabIndex={-1} disabled>
                {Number(cell.date.slice(8))}
              </button>
            )
          }
          const hint = dayHint?.(cell.date)
          return (
            <button
              type="button"
              key={cell.date}
              className={`day-button ${dayClass(cell.date, true)}`}
              disabled={dayDisabled(cell.date, true)}
              aria-pressed={dayPressed(cell.date)}
              aria-label={hint ? `${formatLongDate(cell.date)}, ${hint}` : formatLongDate(cell.date)}
              onClick={() => onPick(cell.date)}
            >
              {Number(cell.date.slice(8))}
            </button>
          )
        })}
      </div>
    </div>
  )
}
