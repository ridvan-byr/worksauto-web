import { z } from 'zod';

export const appointmentCreateSchema = z.object({
  customerId: z.string().min(1, 'Lütfen bir müşteri seçin veya hızlı kayıt yapın.'),
  vehicleId: z.string().min(1, 'Lütfen müşteriye ait bir araç seçin.'),
  serviceId: z.string().optional(),
  date: z.string().optional(),
  slotDate: z.string().optional(),
  slotStartTime: z.string().optional(),
  slotEndTime: z.string().optional(),
  time: z.string().optional(),
  assignedStaffId: z.string().optional(),
  customerNote: z.string().max(500, 'Müşteri notu en fazla 500 karakter olabilir').optional().or(z.literal('')),
  customerNotes: z.string().max(500).optional().or(z.literal('')),
  internalNote: z.string().max(500, 'Dahili not en fazla 500 karakter olabilir').optional().or(z.literal('')),
});

export const quickLeadSchema = z.object({
  fullName: z.string().min(3, 'Müşteri Adı Soyadı en az 3 karakter olmalıdır.'),
  phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz (en az 10 hane).'),
  plate: z.string().min(2, 'Araç plakası zorunludur.'),
});

export type AppointmentCreateValues = z.infer<typeof appointmentCreateSchema>;
export type QuickLeadValues = z.infer<typeof quickLeadSchema>;
