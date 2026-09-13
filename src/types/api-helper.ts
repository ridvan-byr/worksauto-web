/**
 * WorksAuto API Schema Helper
 *
 * Backend'deki Swagger dokümantasyonundan otomatik türetilen tipleri
 * kolayca kullanabilmek için yardımcı tip tanımlamaları.
 *
 * Tipleri güncellemek için:
 * `npm run types:sync`
 */

import type { components, paths } from './api-schema';

// 1. Backend DTO ve Schema Tipleri
export type ApiSchema<T extends keyof components['schemas']> = components['schemas'][T];

// Sık kullanılan DTO örnekleri:
export type CreateCustomerDto = ApiSchema<'CreateCustomerDto'>;
export type CreateVehicleDto = ApiSchema<'CreateVehicleDto'>;
export type CreateWorkOrderDto = ApiSchema<'CreateWorkOrderDto'>;
export type AddWorkOrderItemDto = ApiSchema<'AddWorkOrderItemDto'>;
export type CreateAppointmentDto = ApiSchema<'CreateAppointmentDto'>;
export type CreateInvoiceDto = ApiSchema<'CreateInvoiceDto'>;

// 2. Endpoint Tipleri (Path & Method bazlı)
export type ApiPaths = paths;
