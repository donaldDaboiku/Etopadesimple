import { useEffect, useState } from 'react'
import { listNotices, listSeenNoticeIds, markNoticeRead, type NoticeItem } from './churchApi'
import { noticeText, unseenIds } from './notices'

export function NoticeList({ pastorId }: { pastorId: string | null }) {
  const [items, setItems] = useState<NoticeItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([listNotices(pastorId), listSeenNoticeIds()])
      .then(([notices, seen]) => {
        const open = new Set(unseenIds(notices.map((notice) => notice.id), seen))
        setItems(notices.filter((notice) => open.has(notice.id)))
      })
      .catch(() => setError('Notifications could not be loaded.'))
  }, [pastorId])

  async function dismiss(id: string) {
    setError('')
    try {
      await markNoticeRead(id)
      setItems((current) => current.filter((notice) => notice.id !== id))
    } catch {
      setError('That notification could not be dismissed.')
    }
  }

  return (
    <section className="card notice-card" aria-label="Notifications">
      <h2>Notifications</h2>
      {error ? <p className="form-banner error">{error}</p> : null}
      {items.length === 0 ? (
        <p className="auth-copy">No new notifications.</p>
      ) : (
        <ul className="notice-list">
          {items.map((notice) => (
            <li key={notice.id}>
              <span>{noticeText(notice.kind, notice.visitorName, notice.date, notice.slot)}</span>
              <button type="button" className="secondary-button" onClick={() => void dismiss(notice.id)}>
                Dismiss
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
