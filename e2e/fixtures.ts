import { test as base, expect } from '@playwright/test';

// Browser E2E tests only use explicit mocks. Never fall through to a live API.
export const test = base.extend({
  context: async ({ context }, provideContext) => {
    await context.route('**/api/v1/**', route => route.fulfill({
      status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Unmocked E2E API request blocked' }),
    }));
    await context.routeWebSocket('**', socket => socket.close());
    await provideContext(context);
  },
});
export { expect };
export const TEST_PHONE = '05523741500';
export const TEST_EMAIL = 'ridvanemrebayar@gmail.com';
