import { useEffect, useState } from 'react'
import { listNotices, listSeenNoticeIds, markNoticeRead, type NoticeItem } from './churchApi'
import { noticeText, unseenIds } from './notices'

export function NoticeList({ organisationId, pastorId }: { organisationId: string; pastorId: string | null }) {
  const [items, setItems] = useState<NoticeItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([listNotices(organisationId, pastorId), listSeenNoticeIds(organisationId)])
      .then(([notices, seen]) => {
        const open = new Set(unseenIds(notices.map((notice) => notice.id), seen))
        setItems(notices.filter((notice) => open.has(notice.id)))
      })
      .catch(() => setError('Notifications could not be loaded.'))
  }, [organisationId, pastorId])

  async function dismiss(id: string) {
    setError('')
    try {
      await markNoticeRead(organisationId, id)
      setItems((current) => current.filter((notice) => notice.id !== id))
    } catch {
      setError('That notification could not be dismissed.')
    }
  }

  if (items.length === 0 && !error) return null

  return (
    <section className="card notice-card" aria-label="Notifications">
      <div className="section-header">
        <h2>Notifications</h2>
        {items.length > 0 ? <span className="badge badge-pending">{items.length} new</span> : null}
      </div>
      {error ? (
        <p className="form-banner error" role="alert">
          {error}
        </p>
      ) : null}
      {items.length > 0 ? (
        <ul className="notice-list">
          {items.map((notice) => (
            <li key={notice.id}>
              <span>{noticeText(notice.kind, notice.visitorName, notice.date, notice.slot)}</span>
              <button type="button" className="secondary-button btn-sm" onClick={() => void dismiss(notice.id)}>
                Dismiss
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
