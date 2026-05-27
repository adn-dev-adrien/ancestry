import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import i18n from '../i18n';

beforeEach(() => {
  localStorage.clear();
  i18n.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
});

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}

if (typeof window !== 'undefined' && !('DOMMatrixReadOnly' in window)) {
  class DOMMatrixReadOnlyMock {
    m22 = 1;
  }
  (window as unknown as { DOMMatrixReadOnly: unknown }).DOMMatrixReadOnly = DOMMatrixReadOnlyMock;
}
