import "@testing-library/jest-dom/vitest";

// You can add global test setup here (e.g., mocks)
// Example: stub matchMedia for components relying on it
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: (_listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => {
      // noop: jsdom doesn't implement matchMedia listeners
      void _listener;
      return;
    },
    removeListener: (_listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => {
      void _listener;
      return;
    },
    addEventListener: (
      _type: string,
      _listener: EventListenerOrEventListenerObject,
      _options?: boolean | AddEventListenerOptions
    ) => {
      void _type;
      void _listener;
      void _options;
      return;
    },
    removeEventListener: (
      _type: string,
      _listener: EventListenerOrEventListenerObject,
      _options?: boolean | EventListenerOptions
    ) => {
      void _type;
      void _listener;
      void _options;
      return;
    },
    dispatchEvent: (_event: Event) => {
      void _event;
      return false;
    },
  }),
});
