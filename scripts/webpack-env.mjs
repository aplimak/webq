export const isProduction = process.env.NODE_ENV === 'production';
export const isWebpackServe = Boolean(process.env.WEBPACK_SERVE || false);
export const targetPlatform = process.env.WEBQ_TARGET;

if (!targetPlatform || !['browser', 'cap', 'electron'].includes(targetPlatform)) {
  throw Error(`Unknown target platform: ${targetPlatform}`);
}
