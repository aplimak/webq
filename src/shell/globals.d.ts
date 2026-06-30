/**
 * Supported compilation platforms.
 */
export type TargetPlatform = 'browser' | 'cordova' | 'electron';

export declare global {
  const __WEBQ_NODE_ENV__: string;
  const __WEBQ_WEBPACK_SERVE__: boolean;
  const __WEBQ_TARGET__: TargetPlatform;
}
