import type { SlidePlan, ThemePack } from "@video-gen/contracts";
import { getThemeById } from "@video-gen/contracts";

/**
 * Test data with varied text lengths to verify:
 * - Short text doesn't have excess padding
 * - Medium text fits well with proper line breaks
 * - Long text doesn't overflow safe zones
 * - All text roles render correctly (hook, body, cta, label)
 */

export const TEST_SHORT_POST: SlidePlan = {
  slidePlanVersion: 1,
  meta: {
    title: "Short Post Test",
  },
  slides: [
    {
      index: 0,
      layers: [
        {
          type: "text",
          role: "hook",
          text: "React Tips",
          region: "top",
        },
        {
          type: "text",
          role: "body",
          text: "Keep it simple",
          region: "center",
        },
        {
          type: "text",
          role: "cta",
          text: "Learn more",
          region: "bottom",
        },
      ],
    },
  ],
};

export const TEST_MEDIUM_POST: SlidePlan = {
  slidePlanVersion: 1,
  meta: {
    title: "Medium Post Test",
  },
  slides: [
    {
      index: 0,
      layers: [
        {
          type: "text",
          role: "label",
          text: "Web Development",
          region: "top",
        },
        {
          type: "text",
          role: "hook",
          text: "Master React Hooks",
          region: "center",
        },
      ],
    },
    {
      index: 1,
      layers: [
        {
          type: "text",
          role: "body",
          text: "Learn the powerful patterns that make modern React development easier and faster",
          region: "center",
        },
      ],
    },
    {
      index: 2,
      layers: [
        {
          type: "text",
          role: "hook",
          text: "Start Building Today",
          region: "center",
        },
        {
          type: "text",
          role: "cta",
          text: "Subscribe for more tips",
          region: "bottom",
        },
      ],
    },
  ],
};

export const TEST_LONG_POST: SlidePlan = {
  slidePlanVersion: 1,
  meta: {
    title: "Long Post Test",
  },
  slides: [
    {
      index: 0,
      layers: [
        {
          type: "text",
          role: "label",
          text: "Advanced TypeScript Patterns",
          region: "top",
        },
        {
          type: "text",
          role: "hook",
          text: "Generics, Discriminated Unions & Type Guards",
          region: "center",
        },
      ],
    },
    {
      index: 1,
      layers: [
        {
          type: "text",
          role: "hook",
          text: "Generics: Your Secret Weapon",
          region: "top",
        },
        {
          type: "text",
          role: "body",
          text: "Generics allow you to write flexible, reusable code that works with multiple types while maintaining full type safety. They're essential for building robust libraries and scalable applications.",
          region: "center",
        },
      ],
    },
    {
      index: 2,
      layers: [
        {
          type: "text",
          role: "hook",
          text: "Discriminated Unions for Safety",
          region: "top",
        },
        {
          type: "text",
          role: "body",
          text: "Create type-safe handlers by combining union types with a discriminant property. This prevents bugs at compile time and makes your code self-documenting.",
          region: "center",
        },
      ],
    },
    {
      index: 3,
      layers: [
        {
          type: "text",
          role: "hook",
          text: "Type Guards: Runtime Validation",
          region: "top",
        },
        {
          type: "text",
          role: "body",
          text: "Narrow types at runtime to guarantee safety when working with unknown data. Combine with discriminated unions to create exhaustive handlers that TypeScript verifies for you.",
          region: "center",
        },
      ],
    },
    {
      index: 4,
      layers: [
        {
          type: "text",
          role: "hook",
          text: "Build Better Code",
          region: "top",
        },
        {
          type: "text",
          role: "body",
          text: "Master these patterns to write more maintainable, safer TypeScript applications",
          region: "center",
        },
        {
          type: "text",
          role: "cta",
          text: "Start learning advanced TypeScript today",
          region: "bottom",
        },
      ],
    },
  ],
};

export const TEST_THEME = getThemeById("graph-paper-v1");

export const TEST_SLIDE_DURATIONS_SHORT = [5]; // 5 seconds
export const TEST_SLIDE_DURATIONS_MEDIUM = [5, 5, 5]; // 3 slides × 5 seconds each
export const TEST_SLIDE_DURATIONS_LONG = [5, 5, 5, 5, 5]; // 5 slides × 5 seconds each
