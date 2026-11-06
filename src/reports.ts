import type { BookingRecord } from './bookings.ts'

export type AuditAction = 'requested' | 'confirmed' | 'declined'

export function auditDocumentId(bookingId: string, action: AuditAction) {
  return `${bookingId}_${action}`
}

export function auditText(action: AuditAction, actor: string, visitorName: string, reference: string) {
  if (action === 'requested') return `A visitor requested ${visitorName} (${reference}).`
  if (action === 'confirmed') return `${actor} confirmed ${visitorName} (${reference}).`
  return `${actor} declined ${visitorName} (${reference}).`
}

export function statusCounts(records: BookingRecord[]) {
  return {
    pending: records.filter((record) => record.status === 'pending').length,
    confirmed: records.filter((record) => record.status === 'confirmed').length,
    declined: records.filter((record) => record.status === 'declined').length,
  }
}

export function pastorTallies(records: BookingRecord[], names: { id: string; name: string }[]) {
  const ids = [...new Set(records.map((record) => record.pastor_id))]
  return ids
    .map((pastorId) => {
      const counts = statusCounts(records.filter((record) => record.pastor_id === pastorId))
      return {
        pastorId,
        name: names.find((item) => item.id === pastorId)?.name ?? 'Pastor',
        ...counts,
      }
    })
    .sort((left, right) => left.name.localeCompare(right.name))
}
