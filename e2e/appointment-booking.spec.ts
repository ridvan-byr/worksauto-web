import { test, expect } from '@playwright/test';

test.describe('Appointment Booking & Public Portal E2E', () => {
  test('public customer successfully books appointment via public portal', async ({ page }) => {
    // 1. Mock public tenant information & service catalog
    await page.route('**/api/v1/tenants/public/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'ten_yildiz',
          title: 'Yıldız Oto Servis',
          phone: '02123334455',
          city: 'İstanbul',
          district: 'Kadıköy',
          services: [
            { id: 's1', name: 'Periyodik Bakım (Yağ + 4 Filtre)', durationMinutes: 60, laborPrice: 1250 },
            { id: 's2', name: 'Ön Fren Balata Değişimi', durationMinutes: 45, laborPrice: 850 },
          ],
        }),
      });
    });

    // 2. Mock public booking creation API
    await page.route('**/api/v1/appointments/public/*', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'apt-public-1',
          status: 'PENDING',
          slotDate: '2026-09-15',
          slotStartTime: '2026-09-15T10:00:00Z',
          plate: '34XYZ789',
        }),
      });
    });

    // 3. Navigate to public booking slug
    await page.goto('/book/yildiz-oto-servis');

    // 4. Verify page heading
    await expect(page.getByText('Servis Randevusu Alın')).toBeVisible();

    // 5. Fill customer details
    await page.getByPlaceholder(/Örn: Rıdvan Bayar/i).fill('Murat Demir');
    await page.getByPlaceholder(/0 \(5XX\) XXX XX XX/i).fill('05339876543');
    await page.getByPlaceholder('34 ABC 123').fill('34XYZ789');
    await page.getByPlaceholder(/Örn: BMW 320i/i).fill('Renault Megane 2021');

    // 6. Select service from dropdown
    await page.locator('select').first().selectOption({ index: 0 });

    // 7. Submit appointment request
    const submitBtn = page.getByRole('button', { name: /Randevu Talebini Gönder/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // 8. Verify success confirmation screen
    await expect(page.getByText('Randevu Talebiniz Alındı!')).toBeVisible();
    await expect(page.getByText('34XYZ789')).toBeVisible();
    await expect(page.getByRole('button', { name: /Yeni Randevu Talebi Oluştur/i })).toBeVisible();
  });

  test('authenticated service advisor accesses appointments calendar', async ({ page, context }) => {
    // 1. Edge Middleware Auth Cookie
    await context.addCookies([
      {
        name: 'worksauto_session',
        value: '1',
        url: 'http://localhost:3000',
      },
    ]);

    // 2. Client-Side Auth Context LocalStorage State
    await context.addInitScript(() => {
      localStorage.setItem(
        'worksauto_auth_session',
        JSON.stringify({
          user: {
            id: 'usr_advisor_1',
            name: 'Mert',
            surname: 'Danışman',
            phone: '05321112233',
            role: 'SERVICE_ADVISOR',
          },
          tenant: {
            id: 'ten_test_1',
            title: 'Test Oto Servis',
            slug: 'test-oto',
            phone: '02123334455',
            isActive: true,
            onboardingCompleted: true,
          },
        })
      );
    });

    // 3. Mock Auth Refresh & Me endpoints to keep client session active
    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'mock_access_jwt_token' }),
      });
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'usr_advisor_1',
          name: 'Mert',
          surname: 'Danışman',
          role: 'SERVICE_ADVISOR',
          tenant: {
            id: 'ten_test_1',
            title: 'Test Oto Servis',
            isActive: true,
            onboardingCompleted: true,
          },
        }),
      });
    });

    // 4. Mock appointments API
    await page.route('**/api/v1/appointments*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'apt-1',
            tenantId: 'ten_test_1',
            customerId: 'cust-1',
            customer: { firstName: 'Kemal', lastName: 'Aksoy', phone: '05329998877' },
            vehicleId: 'veh-1',
            vehicle: { plate: '06ANK06', brand: 'Ford', model: 'Focus' },
            service: { id: 'srv-1', name: 'Fren Kontrolü', defaultDurationMin: 45, basePrice: 850 },
            slotDate: '2026-09-10T00:00:00.000Z',
            slotStartTime: '2026-09-10T11:00:00.000Z',
            status: 'CONFIRMED',
          },
        ]),
      });
    });

    // 5. Navigate to appointments management page
    await page.goto('/appointments');
    await expect(page).toHaveURL(/\/appointments/);

    // 6. Verify calendar header and action button
    await expect(page.getByText('Randevu Takvimi & Atölye Geçişi')).toBeVisible();
    await expect(page.getByRole('button', { name: /Yeni Randevu Oluştur/i })).toBeVisible();
    await expect(page.getByText('Görsel Takvim')).toBeVisible();
    await expect(page.getByText('Liste Tablosu')).toBeVisible();
  });
});
