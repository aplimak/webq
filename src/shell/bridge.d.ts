/**
 * Update status bar color.
 * Works on Android and IOS cordova.
 * @param color Color hex code.
 * @param isDark Is the requested color considered dark? if true, icons would become light and vise versa.
 */
export function updateStatusBarColor(color: string, isDark: boolean): void;

/**
 * Whether the project compiled as production.
 */
export const isProduction: boolean;

/**
 * Whether the project running as installed PWA.
 */
export const isPWA: boolean;

/**
 * Whether the project served by webpack dev server.
 */
export const isWebpackServe: boolean;

/**
 * Supported compilation platforms.
 */
export type TargetPlatform = 'browser' | 'cordova' | 'electron';

/**
 * Indicates the target platform at compile time.
 */
export const targetPlatform: TargetPlatform;

/**
 * Compile time target platform.
 */
export const platform: Record<TargetPlatform, boolean>;
