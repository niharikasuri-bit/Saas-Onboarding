/**
 * Two of the DIGIT packages read BARE globals that they never declare:
 *
 *   @egovernments/digit-ui-components   src/atoms/TextInput.js
 *     Digit?.Utils?.generateUniqueId?.(...)
 *
 *   @egovernments/digit-ui-libraries    src/utils/index.js
 *     globalConfigs?.getConfig("LOCALE_DEFAULT")
 *
 * Optional chaining does NOT guard an *undeclared* identifier — it only guards
 * one that is declared and nullish. So without these two lines the first
 * TextInput render throws a ReferenceError, and the library's localisation
 * bootstrap rejects with "globalConfigs is not defined".
 *
 * Defining them on window makes the bare lookups resolve, and both packages
 * then take their documented fallback path ("en", and `props.id || props.name`).
 *
 * Imported first in main.tsx — ES module side effects run in import order.
 */
declare global {
  interface Window {
    Digit?: Record<string, unknown>;
    globalConfigs?: { getConfig: (key: string) => unknown };
  }
}

window.Digit = window.Digit ?? {};

window.globalConfigs = window.globalConfigs ?? {
  // No remote DIGIT environment is wired up here, so every lookup falls back.
  getConfig: () => undefined,
};

export {};
