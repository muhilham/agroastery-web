import nextConfig from "eslint-config-next";

const config = [
  {
    ignores: [
      ".next/",
      "node_modules/",
      "dist/",
      "build/",
      "coverage/",
      "**/.git/**",
      "**/node_modules/**",
      "**/*.d.ts",
    ],
  },
  ...nextConfig,
];

export default config;
