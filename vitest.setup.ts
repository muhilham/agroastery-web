import '@testing-library/jest-dom';

// Next's metadata internals (lib/testing/seo.ts, issue #133) `require('server-only')`,
// a build-time marker package that throws at runtime outside the react-server
// condition. Externalized CJS bypasses vite aliases, so pre-seed its require
// cache entry with an empty module for the test process only.
import Module from "node:module";
import { createRequire } from "node:module";

try {
  const req = createRequire(import.meta.url);
  const resolved = req.resolve("server-only");
  const stub = new Module(resolved);
  stub.loaded = true;
  stub.exports = {};
  // @ts-expect-error internal API
  Module._cache[resolved] = stub;
} catch {
  // server-only not installed — nothing to stub.
}
