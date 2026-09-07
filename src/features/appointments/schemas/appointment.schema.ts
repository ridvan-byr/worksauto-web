import { z } from 'zod';

export const appointmentCreateSchema = z.object({
  customerId: z.string().min(1, 'Müşteri seçilmelidir'),
  vehicleId: z.string().min(1, 'Araç seçilmelidir'),
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

export type AppointmentCreateValues = z.infer<typeof appointmentCreateSchema>;
