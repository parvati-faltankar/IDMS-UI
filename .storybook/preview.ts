import { createElement } from 'react';
import type { Preview, Decorator } from '@storybook/react';
import '../src/index.css';

// ─── Dark-mode decorator ──────────────────────────────────────────────────────
// Syncs the `data-appearance` attribute on the root element when the
// Appearance toolbar button is toggled. The CSS variables defined in
// excellon-brand-guidelines.css respond to this attribute automatically.
const withAppearance: Decorator = (Story, context) => {
  const appearance =
    (context.globals as { appearance?: string }).appearance ?? 'light';
  document.documentElement.setAttribute('data-appearance', appearance);
  return createElement(Story);
};

// ─── Preview config ───────────────────────────────────────────────────────────

const preview: Preview = {
  globalTypes: {
    appearance: {
      name: 'Appearance',
      description: 'Switch between light and dark theme tokens',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  decorators: [withAppearance],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'padded',
    backgrounds: {
      // Disable the default backgrounds addon — appearance is driven by CSS vars,
      // not background colors. Use the Appearance toolbar button instead.
      disable: true,
    },
  },
};

export default preview;
