export type NoticeKind = 'requested' | 'confirmed' | 'declined'
export type NoticeScope = 'pastor' | 'office'

export function noticeDocumentId(bookingId: string, scope: NoticeScope, kind: NoticeKind) {
  return `${bookingId}_${scope}_${kind}`
}

export function noticeText(kind: NoticeKind, visitorName: string, date: string, slot: string) {
  if (kind === 'requested') return `${visitorName} requested ${date} at ${slot}.`
  if (kind === 'confirmed') return `${visitorName} on ${date} at ${slot} was confirmed.`
  return `${visitorName} on ${date} at ${slot} was declined.`
}

export function unseenIds(noticeIds: string[], seenIds: string[]) {
  const seen = new Set(seenIds)
  return noticeIds.filter((id) => !seen.has(id))
}
