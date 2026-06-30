export const isProduction = process.env.NODE_ENV === 'production';
export const isWebpackServe = Boolean(process.env.WEBPACK_SERVE || false);
export const targetPlatform = process.env.WEBQ_TARGET;

if (!targetPlatform || !['browser', 'cordova', 'electron'].includes(targetPlatform)) {
  throw Error(`Unknown target platform: ${targetPlatform}`);
}
if (targetPlatform === 'electron' && isWebpackServe) {
  throw Error("Can't serve electron target with webpack");
}
