import { describe, it, expect } from 'vitest'
import {
  formatEntityName,
  formatStatus,
  formatPaymentMethod,
  formatRole,
  formatClientIp,
  getActionTitle,
} from './audit-formatters'

describe('Audit Formatters', () => {
  it('translates entity names accurately to Turkish', () => {
    expect(formatEntityName('workorder')).toBe('İş Emri')
    expect(formatEntityName('work_order')).toBe('İş Emri')
    expect(formatEntityName('appointment')).toBe('Randevu')
    expect(formatEntityName('invoice')).toBe('Fatura')
    expect(formatEntityName('customer')).toBe('Müşteri')
    expect(formatEntityName('vehicle')).toBe('Araç')
    expect(formatEntityName('inventory')).toBe('Stok Parça')
    expect(formatEntityName(undefined)).toBe('Kayıt')
  })

  it('translates status codes correctly', () => {
    expect(formatStatus('IN_PROGRESS')).toBe('İşlemde')
    expect(formatStatus('COMPLETED')).toBe('Tamamlandı')
    expect(formatStatus('CANCELLED')).toBe('İptal Edildi')
    expect(formatStatus('CONFIRMED')).toBe('Onaylandı')
    expect(formatStatus('PAID')).toBe('Ödendi')
    expect(formatStatus('UNPAID')).toBe('UNPAID')
    expect(formatStatus(undefined)).toBe('')
  })

  it('translates payment methods correctly', () => {
    expect(formatPaymentMethod('CASH')).toBe('Nakit')
    expect(formatPaymentMethod('CREDIT_CARD')).toBe('Kredi Kartı')
    expect(formatPaymentMethod('BANK_TRANSFER')).toBe('Havale / EFT')
    expect(formatPaymentMethod(undefined)).toBe('Nakit')
  })

  it('translates user roles correctly', () => {
    expect(formatRole('OWNER')).toBe('Servis Sahibi')
    expect(formatRole('TECHNICIAN')).toBe('Atölye Ustası')
    expect(formatRole('SERVICE_MANAGER')).toBe('Servis Yöneticisi')
    expect(formatRole('TENANT_ADMIN')).toBe('İşletme Yöneticisi')
  })

  it('cleans up and masks IP addresses properly', () => {
    expect(formatClientIp('::1')).toBe('127.0.0.1 (Yerel)')
    expect(formatClientIp('127.0.0.1')).toBe('127.0.0.1 (Yerel)')
    expect(formatClientIp('localhost')).toBe('127.0.0.1 (Yerel)')
    expect(formatClientIp(undefined)).toBe('127.0.0.1 (Yerel)')
  })

  it('translates action titles accurately', () => {
    expect(getActionTitle('work_order.item_quantity_updated')).toBe('İş Emrinde Parça / Kalem Adedi Güncellendi')
    expect(getActionTitle('work_order.item_added')).toBe('İş Emrine Yeni Parça / İşçilik Kalemi Eklendi')
    expect(getActionTitle('work_order.item_removed')).toBe('İş Emrinden Parça / İşçilik Kalemi Silindi')
    expect(getActionTitle('staff.lift_changed')).toBe('Personele Atanan Lift Değiştirildi')
    expect(getActionTitle('staff.updated')).toBe('Personel Bilgileri / Yetkileri Güncellendi')
  })
})
