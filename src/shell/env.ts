import pkg from 'package.json';

const PLATFORMS = ['browser', 'cap', 'electron'] as const;

/**
 * Supported compilation platforms.
 */
export type TargetPlatform = (typeof PLATFORMS)[number];

interface ApplicationInformation {
  /**
   * Application name.
   * It's usally the package name.
   */
  name: string;

  /**
   * Application friendly name.
   */
  title: string;

  /**
   * Application version.
   */
  version: string;
}

/**
 * Whether the project compiled as production.
 */
export const isProduction: boolean = __WEBQ_NODE_ENV__ === 'production';

/**
 * Whether the project running as installed PWA.
 */
export const isPWA: boolean =
  window.matchMedia('(display-mode: standalone)').matches ||
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window.navigator as any).standalone === true;

/**
 * Whether the project served by webpack dev server.
 */
export const isWebpackServe: boolean = __WEBQ_WEBPACK_SERVE__;

/**
 * Indicates the target platform at compile time.
 */
export const targetPlatform: TargetPlatform = __WEBQ_TARGET__;

/**
 * Compile time target platform.
 */
export const platform = PLATFORMS.reduce(
  (acc, name) => {
    acc[name] = targetPlatform === name;
    return acc;
  },
  {} as Record<TargetPlatform, boolean>
);

/**
 * Application info.
 */
export const app: ApplicationInformation = {
  name: pkg.name,
  title: pkg.displayName,
  version: pkg.version,
};
