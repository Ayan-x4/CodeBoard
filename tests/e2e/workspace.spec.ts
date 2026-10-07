import { test, expect } from '@playwright/test';

test('runs JavaScript in a sandbox and keeps runtime errors in the output', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.monaco-editor')).toBeVisible();
  await page.getByRole('button', { name: /Run code/ }).first().click();
  await expect(page.locator('.stdout')).toContainText('3 students scored 80 or above!');
  await expect(page.getByText('Completed successfully')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('desktop.png'), fullPage: true });
  expect(errors).toEqual([]);
  await page.locator('.monaco-editor').click();
  await page.keyboard.press('Control+a');
  await page.keyboard.insertText('throw new Error("A teachable moment");');
  await page.keyboard.press('Control+Enter');
  await expect(page.locator('.stderr')).toContainText('A teachable moment');
});

test('whiteboard drawing is undoable and survives a saved project reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.canvas-loading')).toHaveCount(0);
  await expect(page.locator('.board-status')).toContainText('objects');
  const initial = Number((await page.locator('.board-status').innerText()).match(/(\d+) objects/)?.[1]);
  await page.getByRole('button', { name: 'Rectangle (R)', exact: true }).click();
  const rect = await page.locator('.upper-canvas').boundingBox();
  if (!rect) throw new Error('Canvas missing');
  await page.mouse.move(rect.x + 90, rect.y + 160);
  await page.mouse.down();
  await page.mouse.move(rect.x + 190, rect.y + 220, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator('.board-status')).toContainText(`${initial + 1} objects`);
  await page.getByRole('button', { name: 'Undo drawing (Ctrl+Z)', exact: true }).click();
  await expect(page.locator('.board-status')).toContainText(`${initial} objects`);
  await page.getByRole('button', { name: 'Redo drawing (Ctrl+Shift+Z)', exact: true }).click();
  await expect(page.locator('.board-status')).toContainText(`${initial + 1} objects`);
  await page.keyboard.press('Control+s');
  await expect(page.locator('.save-indicator')).toContainText('Saved locally');
  await page.reload();
  await expect(page.locator('.board-status')).toContainText(`${initial + 1} objects`);
});

test('project creation, new files, commands, and presentation mode work', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+p');
  await page.getByRole('textbox', { name: 'Search commands' }).fill('New project');
  await page.keyboard.press('Enter');
  await page.getByLabel('Project name', { exact: true }).fill('Java Arrays Masterclass');
  await page.getByLabel('Starting language').selectOption('java');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('tab', { name: /Main.java/ })).toBeVisible();
  await page.getByRole('button', { name: 'New file', exact: true }).click();
  await page.getByLabel('File name', { exact: true }).fill('ArrayExample.java');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('tab', { name: /ArrayExample.java/ })).toBeVisible();
  await page.getByRole('button', { name: 'Run code' }).click();
  await expect(page.locator('.stderr')).toContainText('connect a secure execution provider');
  await page.getByRole('button', { name: 'Present', exact: true }).click();
  await expect(page.locator('.presentation-header')).toBeVisible();
  await expect(page.locator('.sidebar')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('.app-header')).toBeVisible();
});

test('mobile has usable code, output, and whiteboard tabs without horizontal overflow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.mobile-panel-tabs')).toBeVisible();
  await page.locator('.mobile-panel-tabs').getByRole('button', { name: 'Whiteboard' }).click();
  await expect(page.locator('.upper-canvas')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('mobile.png'), fullPage: true });
  await page.locator('.mobile-panel-tabs').getByRole('button', { name: 'Output' }).click();
  await expect(page.getByRole('region', { name: 'Output console' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('sandbox prevents network and parent access and stops infinite loops', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.monaco-editor')).toBeVisible();
  await page.locator('.monaco-editor').click();
  await page.keyboard.press('Control+a');
  await page.keyboard.insertText('console.log("DOM:", typeof document, "parent:", typeof parent);\ntry { await fetch("https://example.com"); } catch { console.log("Network blocked"); }');
  await page.keyboard.press('Control+Enter');
  await expect(page.locator('.stdout')).toContainText('DOM: undefined parent: undefined');
  await expect(page.locator('.stdout')).toContainText('Network blocked');
  await page.locator('.monaco-editor').click();
  await page.keyboard.press('Control+a');
  await page.keyboard.insertText('while (true) {}');
  await page.keyboard.press('Control+Enter');
  await expect(page.locator('.stderr')).toContainText('5 second limit', { timeout: 8000 });
  await page.getByRole('button', { name: 'Project options' }).click();
  await expect(page.getByRole('button', { name: 'New project', exact: true })).toBeVisible();
});

test('TypeScript runs and selected code becomes an editable line-linked explanation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.monaco-editor')).toBeVisible();
  await page.locator('.language-trigger').click();
  await page.getByRole('textbox', { name: 'Search programming languages' }).fill('TypeScript');
  await page.locator('.language-list').getByRole('button', { name: /TypeScript/ }).click();
  await page.locator('.monaco-editor').click();
  await page.keyboard.press('Control+a');
  await page.keyboard.insertText('const count: number = 42;\nconsole.log(count);');
  await page.keyboard.press('Control+Enter');
  await expect(page.locator('.stdout')).toContainText('42', { timeout: 15_000 });
  await page.locator('.monaco-editor').click();
  await page.keyboard.press('Control+a');
  const initial = Number((await page.locator('.board-status').innerText()).match(/(\d+) objects/)?.[1]);
  await page.getByRole('button', { name: 'Explain selected code on whiteboard' }).click();
  await expect(page.locator('.board-status')).toContainText(`${initial + 2} objects`);
  await page.keyboard.press('Control+s');
  await expect(page.locator('.save-indicator')).toContainText('Saved locally');
  const hasLineLink = await page.evaluate(() => JSON.parse(localStorage.getItem('codeboard.projects.v1') ?? '[]')[0].whiteboard.objects.some((object: { lineLink?: unknown }) => Boolean(object.lineLink)));
  expect(hasLineLink).toBe(true);
});

test('panel layouts resize, swap, and maximize independently', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Code editor' })).toBeVisible();
  const separator = page.getByRole('separator', { name: 'Resize columns', exact: true });
  await separator.focus();
  await page.keyboard.press('ArrowRight');
  await expect(separator).toHaveAttribute('aria-valuenow', '50');
  await page.getByRole('button', { name: 'Swap panel positions' }).click();
  const board = await page.getByRole('region', { name: 'Interactive whiteboard' }).boundingBox();
  const editor = await page.getByRole('region', { name: 'Code editor' }).boundingBox();
  expect(board!.x).toBeLessThan(editor!.x);
  await page.getByRole('button', { name: 'Maximize whiteboard panel' }).click();
  await expect(page.getByRole('region', { name: 'Code editor' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Restore whiteboard panel' }).click();
  await page.getByRole('button', { name: 'Stacked layout' }).click();
  await expect(page.getByRole('separator', { name: 'Resize rows' })).toHaveCount(2);
  await page.getByRole('button', { name: 'Studio layout: code and output above whiteboard' }).click();
  await expect(page.getByRole('region', { name: 'Output console' })).toBeVisible();
});

test('pen, text, and object eraser work and leave editor undo independent', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.canvas-loading')).toHaveCount(0);
  await expect(page.locator('.board-status')).toContainText('23 objects');
  await page.getByRole('button', { name: 'Pen / freehand (P)', exact: true }).click();
  const area = await page.locator('.upper-canvas').boundingBox();
  if (!area) throw new Error('Canvas missing');
  const x = area.x + 35, y = area.y + 160;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 80, y + 40, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator('.board-status')).toContainText('24 objects');
  await page.getByRole('button', { name: 'Eraser (E)', exact: true }).click();
  await page.mouse.click(x + 40, y + 20);
  await expect(page.locator('.board-status')).toContainText('23 objects');
  await page.getByRole('button', { name: 'Text (T)', exact: true }).click();
  await page.mouse.click(x + 5, y + 15);
  await page.keyboard.insertText('A handwritten idea, typed.');
  await page.getByRole('button', { name: 'Selection (V)', exact: true }).click();
  await expect(page.locator('.board-status')).toContainText('24 objects');
  await page.locator('.monaco-editor').click();
  await page.keyboard.press('Control+End');
  await page.keyboard.insertText('\nconsole.log("new line");');
  await page.keyboard.press('Control+z');
  await expect(page.locator('.board-status')).toContainText('24 objects');
  await page.keyboard.press('Control+s');
  await expect(page.locator('.save-indicator')).toContainText('Saved locally');
  const savedText = await page.evaluate(() => JSON.parse(localStorage.getItem('codeboard.projects.v1') ?? '[]')[0].whiteboard.objects.some((object: { text?: string }) => object.text?.includes('A handwritten idea, typed.')));
  expect(savedText).toBe(true);
});
