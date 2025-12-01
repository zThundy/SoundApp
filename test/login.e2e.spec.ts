import { test, expect, _electron as electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import path from 'path';

test.describe('Login Functionality', () => {
  let electronApp: ElectronApplication;
  let window: Page;

  test.beforeAll(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist-electron/main/index.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });

    // Get the first window
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should display login page on startup', async () => {
    // Wait for the login page to be visible
    await window.waitForSelector('[data-testid="login-page"]', { timeout: 10000 });
    
    // Check if login button exists
    const loginButton = await window.locator('button:has-text("Login")').first();
    await expect(loginButton).toBeVisible();
  });

  test('should show Twitch login button', async () => {
    // Check for Twitch login button
    const twitchLoginButton = await window.locator('button:has-text("Twitch")').first();
    await expect(twitchLoginButton).toBeVisible();
  });

  test('should handle login button click', async () => {
    // Click the login button
    const loginButton = await window.locator('button:has-text("Login")').first();
    await loginButton.click();

    // Wait for some response (adjust based on your app's behavior)
    await window.waitForTimeout(2000);

    // Verify that clicking doesn't crash the app
    const isVisible = await loginButton.isVisible();
    expect(isVisible).toBeTruthy();
  });

  test('should navigate after successful login', async () => {
    // This test would require actual Twitch credentials
    // For now, we'll just verify the app structure is ready for login
    
    // Check if the app has the necessary login handlers
    const result = await electronApp.evaluate(async ({ ipcMain }) => {
      const listeners = (ipcMain as any).eventNames();
      return listeners.includes('twitch:login') || listeners.includes('auth:login');
    });

    expect(result).toBeTruthy();
  });

  test('should maintain window state during login flow', async () => {
    const windowCount = await electronApp.windows().length;
    expect(windowCount).toBeGreaterThanOrEqual(1);

    // Verify window is not destroyed
    const isWindowVisible = await window.isVisible();
    expect(isWindowVisible).toBeTruthy();
  });
});
