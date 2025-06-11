module.exports = {
  root: true,
  // This tells ESLint to load the config from the package `eslint-config-custom`
  extends: ['./eslint/eslint.base.js', './eslint/eslint.ts.js'],
  parserOptions: {
    tsconfigRootDir: __dirname,
  },
};