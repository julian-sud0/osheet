const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Platform extensions: .web.ts / .web.tsx for web, .native.ts for iOS+Android.
// Lets us fork storage / pdf modules cleanly.
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'web.ts',
  'web.tsx',
  'native.ts',
  'native.tsx',
];

module.exports = config;
