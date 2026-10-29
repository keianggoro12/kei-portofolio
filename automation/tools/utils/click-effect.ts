import { Page } from '@playwright/test';

/**
 * Inject a click "ripple" overlay so that clicks are visible in the recorded
 * video. Playwright's headless video has no cursor, so without this an action
 * looks like the UI changing on its own.
 *
 * The injected element is `pointer-events: none`, so it cannot interfere with
 * the application under test.
 */
export async function addClickEffect(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const CSS = `
      .pw-click-effect {
        position: fixed;
        z-index: 2147483647;
        width: 16px;
        height: 16px;
        margin: -8px 0 0 -8px;
        border-radius: 9999px;
        background: rgba(37, 99, 235, 0.30);
        border: 3px solid rgba(37, 99, 235, 0.95);
        pointer-events: none;
        animation: pw-click-effect 700ms ease-out forwards;
      }
      @keyframes pw-click-effect {
        0% { opacity: 1; transform: scale(0.4); }
        100% { opacity: 0; transform: scale(3.2); }
      }
    `;

    const install = () => {
      if (!document.getElementById('pw-click-effect-style')) {
        const style = document.createElement('style');
        style.id = 'pw-click-effect-style';
        style.textContent = CSS;
        (document.head || document.documentElement).appendChild(style);
      }

      const show = (event: MouseEvent) => {
        const ripple = document.createElement('div');
        ripple.className = 'pw-click-effect';
        ripple.style.left = `${event.clientX}px`;
        ripple.style.top = `${event.clientY}px`;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
      };

      window.addEventListener('mousedown', show, true);
    };

    if (document.body) {
      install();
    } else {
      document.addEventListener('DOMContentLoaded', install, { once: true });
    }
  });
}
