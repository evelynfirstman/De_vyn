const path = require("path");

module.exports = {
  presets: ["babel-preset-expo"],
  plugins: [
    [
      "module-resolver",
      {
        alias: {
          "@vyn/tokens": path.join(
            __dirname,
            "../../packages/tokens/tokens",
          ),
          "@vyn/ui": path.join(__dirname, "../../packages/ui/src/index"),
        },
      },
    ],
  ],
};
