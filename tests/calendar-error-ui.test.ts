import { test } from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { useCalendarEvents } from '../app/(app)/calendar/hooks/useCalendarEvents';

test('shows backend error message when calendar events fetch fails', async (t) => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.com' });

  (globalThis as any).window = dom.window;
  (globalThis as any).document = dom.window.document;
  (globalThis as any).navigator = dom.window.navigator;
  (globalThis as any).localStorage = dom.window.localStorage;
  (globalThis as any).sessionStorage = dom.window.sessionStorage;
  (globalThis as any).HTMLElement = dom.window.HTMLElement;
  (globalThis as any).SVGElement = dom.window.SVGElement;
  (globalThis as any).CustomEvent = dom.window.CustomEvent;
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

  const originalFetch = globalThis.fetch;
  (globalThis as any).fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ error: 'Test failure message' }),
  });

  t.after(() => {
    (globalThis as any).fetch = originalFetch;
    dom.window.close();
    delete (globalThis as any).window;
    delete (globalThis as any).document;
    delete (globalThis as any).navigator;
    delete (globalThis as any).localStorage;
    delete (globalThis as any).sessionStorage;
    delete (globalThis as any).HTMLElement;
    delete (globalThis as any).SVGElement;
    delete (globalThis as any).CustomEvent;
    delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
  });

  const CalendarErrorHarness = () => {
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-02T00:00:00Z');
    const { error, refresh } = useCalendarEvents(start, end);
    return React.createElement(
      React.Fragment,
      null,
      error &&
        React.createElement(
          'div',
          { 'data-testid': 'calendar-error-banner' },
          error.message ? `Could not load events: ${error.message}` : 'Could not load events.'
        ),
      React.createElement('button', { 'data-testid': 'refresh-button', onClick: () => refresh() })
    );
  };

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(CalendarErrorHarness));
  });

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  const banner = container.querySelector('[data-testid="calendar-error-banner"]');
  assert.ok(banner, 'error banner should be rendered when fetch fails');
  assert.ok(
    banner!.textContent?.includes('Test failure message'),
    'error banner should surface backend error message'
  );

  await act(async () => {
    root.unmount();
  });
});
