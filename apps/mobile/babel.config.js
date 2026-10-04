const path = require("path");

const posix = (...parts) => path.join(...parts).split(path.sep).join("/");
const mobileRoot = posix(__dirname);
const repoRoot = posix(__dirname, "..", "..");

module.exports = {
  presets: ["babel-preset-expo"],
  plugins: [
    [
      "module-resolver",
      {
        alias: {
          "@vyn/tokens": `${repoRoot}/packages/tokens/tokens`,
          "@vyn/ui": `${repoRoot}/packages/ui/src/index`,
          // Single-copy React: the monorepo root also hosts React 18
          // (admin). Without this, react-native-web pulls root React 18
          // while app code uses nested React 19 and every element throws
          // "Objects are not valid as a React child".
          // NOTE: do NOT alias react-native itself — Expo's resolver
          // remaps it to react-native-web, and bypassing that breaks web.
          react: `${mobileRoot}/node_modules/react`,
          "react-dom": `${mobileRoot}/node_modules/react-dom`,
        },
      },
    ],
  ],
};
