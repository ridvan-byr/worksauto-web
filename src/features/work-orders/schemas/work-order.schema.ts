import { z } from 'zod';

export const workOrderItemSchema = z.object({
  itemType: z.enum(['PART', 'SERVICE']),
  itemId: z.string().optional(),
  name: z.string().min(2, 'Kalem adı en az 2 karakter olmalıdır'),
  quantity: z.number().min(0.01, 'Miktar 0 dan büyük olmalıdır'),
  unitPrice: z.number().min(0, 'Birim fiyat 0 dan küçük olamaz'),
  kdvRate: z.number().min(0).max(100).optional().default(20),
});

export const workOrderCreateSchema = z.object({
  customerId: z.string().min(1, 'Müşteri seçilmelidir'),
  vehicleId: z.string().min(1, 'Araç seçilmelidir'),
  appointmentId: z.string().optional(),
  assignedMechanicId: z.string().optional(),
  assignedLift: z.string().max(50).optional(),
  initialKm: z.number().min(0, 'Kilometre 0 dan küçük olamaz'),
  fuelLevel: z.string().max(50).optional(),
  items: z.array(workOrderItemSchema).default([]),
});

export const addWorkOrderItemFormSchema = z.object({
  itemType: z.enum(['PART', 'SERVICE']),
  itemId: z.string().optional(),
  name: z.string().min(2, 'Parça/Hizmet adı girilmelidir'),
  quantity: z.number().min(1, 'Miktar en az 1 olmalıdır'),
  unitPrice: z.number().min(0, 'Fiyat 0 dan küçük olamaz'),
  kdvRate: z.number().min(0).max(100).optional().default(20),
});

export type WorkOrderCreateValues = z.infer<typeof workOrderCreateSchema>;
export type AddWorkOrderItemFormValues = z.infer<typeof addWorkOrderItemFormSchema>;

export const createWorkOrderModalStep1Schema = z.object({
  customerId: z.string().min(1, 'Lütfen bir müşteri seçiniz.'),
  vehicleId: z.string().min(1, 'Lütfen aracı seçiniz.'),
});

export const createWorkOrderModalStep2Schema = z.object({
  serviceName: z.string().min(2, 'İşlem/Hizmet adı en az 2 karakter olmalıdır.'),
  laborPrice: z
    .number({ message: 'İşçilik ücreti sayı olmalıdır' })
    .min(0, 'İşçilik ücreti negatif olamaz.'),
  assignedLift: z.string().min(1, 'Lift seçimi zorunludur.'),
  assignedMechanic: z.string().min(1, 'Usta seçimi zorunludur.'),
});

export const createWorkOrderModalSchema = z.object({
  customerId: z.string().min(1, 'Lütfen bir müşteri seçiniz.'),
  vehicleId: z.string().min(1, 'Lütfen aracı seçiniz.'),
  serviceName: z.string().min(2, 'İşlem/Hizmet adı en az 2 karakter olmalıdır.'),
  laborPrice: z
    .number({ message: 'İşçilik ücreti sayı olmalıdır' })
    .min(0, 'İşçilik ücreti negatif olamaz.'),
  assignedLift: z.string().min(1, 'Lift seçimi zorunludur.'),
  assignedMechanic: z.string().min(1, 'Usta seçimi zorunludur.'),
  priority: z.enum(['NORMAL', 'HIGH', 'URGENT']),
  initialNote: z.string().max(500).optional().or(z.literal('')),
});

export type CreateWorkOrderModalValues = z.infer<typeof createWorkOrderModalSchema>;
export type CreateWorkOrderModalStep1Values = z.infer<typeof createWorkOrderModalStep1Schema>;
export type CreateWorkOrderModalStep2Values = z.infer<typeof createWorkOrderModalStep2Schema>;

