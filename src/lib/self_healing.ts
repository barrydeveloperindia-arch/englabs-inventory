import { Page, ElementHandle } from '@playwright/test';

interface ElementIdentity {
    role?: string;
    text?: string;
    name?: string;
    tagName?: string;
    className?: string;
}

/**
 * Self-Healing Locator Wrapper
 * 
 * Logic: Old selector fail -> DOM scan -> best match -> retry
 */
export async function smartClick(page: Page, selector: string, identity: ElementIdentity) {
    try {
        // 1. Attempt standard click with short timeout
        await page.click(selector, { timeout: 3000 });
    } catch (error) {
        console.warn(`[SELF-HEALING] ⚠️ Selector failed: ${selector}. Identity: ${JSON.stringify(identity)}`);

        // 2. DOM Scan for best match
        const healedSelector = await findBestMatch(page, identity);

        if (healedSelector) {
            console.log(`[SELF-HEALING] ✅ Best match found: ${healedSelector}. Retrying operation...`);
            await page.click(healedSelector);

            // Log for developer to update the test
            console.info(`[AUDIT] Recommendation: Update '${selector}' to '${healedSelector}'`);
        } else {
            console.error(`[SELF-HEALING] ❌ Failed to heal selector for ${JSON.stringify(identity)}`);
            throw new Error(`[SELF-HEALING] ❌ Failed to heal selector for ${JSON.stringify(identity)}`);
        }
    }
}

async function findBestMatch(page: Page, identity: ElementIdentity): Promise<string | null> {
    page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));

    // Strategy A: By Role and Name (Highly Reliable)
    if (identity.role && (identity.name || identity.text)) {
        console.log(`[HEALER] Strategy A: Looking for role ${identity.role} with name ${identity.name || identity.text}`);
        const locator = page.getByRole(identity.role as any, { name: identity.name || identity.text });
        const count = await locator.count();
        if (count >= 1) {
            const found = `role=${identity.role}[name="${identity.name || identity.text}"] >> nth=0`;
            console.log(`[HEALER] Strategy A Found: ${found}`);
            return found;
        }
    }

    // Strategy B: By Text Content
    if (identity.text) {
        console.log(`[HEALER] Strategy B: Looking for text "${identity.text}"`);
        const locator = page.getByText(identity.text, { exact: true });
        const count = await locator.count();
        if (count >= 1) {
            // If multiple, try to find the one that is a button or link
            for (let i = 0; i < count; i++) {
                const el = locator.nth(i);
                const tagName = await el.evaluate(node => node.tagName);
                if (['BUTTON', 'A'].includes(tagName)) {
                    const found = `text="${identity.text}" >> nth=${i}`;
                    console.log(`[HEALER] Strategy B Found (Interactive): ${found}`);
                    return found;
                }
            }
            const found = `text="${identity.text}" >> nth=0`;
            console.log(`[HEALER] Strategy B Found (Default): ${found}`);
            return found;
        }
    }

    // Strategy C: Advanced DOM Analysis via Script
    const bestMatch = await page.evaluate((id) => {
        const elements = Array.from(document.querySelectorAll('button, input, a, div, span, h1, h2, h3, [role="button"]'));
        console.log(`[HEALER] Identity:`, JSON.stringify(id));
        let best: HTMLElement | null = null;
        let maxScore = -1;

        elements.forEach(el => {
            let score = 0;
            const htmlEl = el as HTMLElement;
            const text = (htmlEl.innerText || htmlEl.textContent || '').trim();

            const style = window.getComputedStyle(htmlEl);
            if (style.display === 'none' || style.visibility === 'hidden' || (style.opacity === '0' && htmlEl.tagName !== 'INPUT')) return;

            if (htmlEl.tagName === 'BUTTON') {
                console.log(`[HEALER SCAN] Button Text: "${text}" | ID: ${htmlEl.id} | TestID: ${htmlEl.getAttribute('data-testid')}`);
            }

            // Priority score for interactive tags
            if (['BUTTON', 'A', 'INPUT'].includes(htmlEl.tagName)) score += 2;
            if (htmlEl.getAttribute('role') === 'button') score += 2;

            const placeholder = htmlEl.getAttribute('placeholder') || '';
            const value = (htmlEl as HTMLInputElement).value || '';

            if (id.text && (
                text === id.text ||
                htmlEl.getAttribute('title') === id.text ||
                htmlEl.getAttribute('aria-label') === id.text ||
                placeholder === id.text ||
                value === id.text
            )) score += 10;
            else if (id.text && (text.includes(id.text) || placeholder.includes(id.text))) score += 5;

            if (id.className && htmlEl.className && typeof htmlEl.className === 'string' && htmlEl.className.includes(id.className)) score += 3;
            if (id.name && (htmlEl.getAttribute('name') === id.name || htmlEl.getAttribute('aria-label') === id.name)) score += 4;

            // Enhanced Role Matching
            const elRole = htmlEl.getAttribute('role');
            const isButton = htmlEl.tagName === 'BUTTON' || elRole === 'button';
            const isTextbox = htmlEl.tagName === 'INPUT' || elRole === 'textbox';

            if (id.role) {
                if (elRole === id.role) score += 4;
                else if (id.role === 'button' && isButton) score += 4;
                else if (id.role === 'textbox' && isTextbox) score += 4;
            }

            if (score > 0) {
                console.log(`[HEALER SCORE] ${score} | <${htmlEl.tagName}> "${text.substring(0, 30)}" | TestID: ${htmlEl.getAttribute('data-testid')}`);
            }

            if (score > maxScore) {
                maxScore = score;
                best = htmlEl;
            }
        });

        if (maxScore >= 5 && best) {
            const b = best as HTMLElement;
            console.log(`[HEALER WINNER] Score ${maxScore}: <${b.tagName}> "${b.innerText.substring(0, 20)}"`);
            if (b.getAttribute('data-testid')) return `[data-testid="${b.getAttribute('data-testid')}"]`;
            if (b.id) return `#${b.id}`;
            if (b.tagName === 'BUTTON' && b.innerText) return `button:has-text("${b.innerText.trim()}")`;
            return `button:has-text("${b.innerText.substring(0, 10)}")`;
        }
        return null;
    }, identity);

    return bestMatch;
}
