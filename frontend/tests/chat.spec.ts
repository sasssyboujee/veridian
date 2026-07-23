import { test, expect } from '@playwright/test';

test.describe('Asset Chat UI', () => {
  test('verifies scroll isolation and dynamic sizing', async ({ page }) => {
    // Navigate to investor page
    await page.goto('http://localhost:3000/investor');

    // Wait for the asset selector to be present (to ensure page has loaded)
    await page.waitForSelector('text=SELECT ASSET');

    // Click on the AI Assistant tab
    await page.getByRole('button', { name: 'AI Assistant' }).click();

    // Give it a moment to render the chat tab
    await page.waitForTimeout(1000);

    // Baseline screenshot
    await page.screenshot({ path: 'test-results/baseline.png', fullPage: true });

    // Find the chat card
    const chatCard = page.locator('.chat-card');
    await expect(chatCard).toBeVisible();

    // The chat card shouldn't exceed 80vh
    const boundingBox = await chatCard.boundingBox();
    const viewportSize = page.viewportSize();
    expect(boundingBox?.height).toBeLessThanOrEqual(viewportSize!.height * 0.8 + 5);

    // Verify chat-messages-area has scroll containment
    const messagesArea = page.locator('.chat-messages-area');
    await expect(messagesArea).toHaveCSS('overscroll-behavior', 'contain');
    await expect(messagesArea).toHaveCSS('overflow-y', 'auto');

    // Inject text to trigger overflow
    const input = page.getByPlaceholder('Ask about yield performance');
    
    for (let i = 0; i < 15; i++) {
      await input.fill('This is a test message to fill up the chat history and trigger scrolling ' + i + '\\n'.repeat(2));
      await input.press('Enter');
      await page.waitForTimeout(500);
    }

    // Verify footer is pinned to the bottom of the card
    const footer = page.locator('.chat-input-footer');
    await expect(footer).toHaveCSS('margin-bottom', '0px');
    
    // Check bounding boxes to verify flush bottom
    const cardBox = await chatCard.boundingBox();
    const footerBox = await footer.boundingBox();
    // footer bottom should match card bottom (within a 2px tolerance for borders)
    expect(Math.abs((cardBox!.y + cardBox!.height) - (footerBox!.y + footerBox!.height))).toBeLessThanOrEqual(2);
    
    // Take a screenshot of the filled chat
    await page.screenshot({ path: 'test-results/filled-chat.png', fullPage: true });

    // Verify scrolling of messagesArea
    const isScrollable = await messagesArea.evaluate((node) => {
      return node.scrollHeight > node.clientHeight;
    });
    
    expect(isScrollable).toBeTruthy();
  });
});
