import { monthCells, monthLabel, WEEKDAY_LABELS } from './availability.ts'

type MonthCalendarProps = {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
  prevDisabled?: boolean
  nextDisabled?: boolean
  dayLabel: (date: string) => string
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
  dayLabel,
  dayDisabled,
  dayPressed,
  dayClass,
  onPick,
}: MonthCalendarProps) {
  const label = monthLabel(year, month)
  return (
    <div className="calendar">
      <div className="calendar-nav">
        <button type="button" className="secondary-button calendar-nav-button" onClick={onPrev} disabled={prevDisabled}>
          Previous
        </button>
        <strong>{label}</strong>
        <button type="button" className="secondary-button calendar-nav-button" onClick={onNext} disabled={nextDisabled}>
          Next
        </button>
      </div>
      <div className="calendar-grid" role="grid" aria-label={label}>
        {WEEKDAY_LABELS.map((name) => (
          <span key={name} className="calendar-dow">
            {name}
          </span>
        ))}
        {monthCells(year, month).map((cell) => (
          <button
            type="button"
            key={cell.date}
            className={`day-button ${dayClass(cell.date, cell.inMonth)}`}
            disabled={dayDisabled(cell.date, cell.inMonth)}
            aria-pressed={dayPressed(cell.date)}
            aria-label={dayLabel(cell.date)}
            onClick={() => onPick(cell.date)}
          >
            {Number(cell.date.slice(8))}
          </button>
        ))}
      </div>
    </div>
  )
}
