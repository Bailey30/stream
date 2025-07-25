import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
// import nodePolyfills from "rollup-plugin-polyfill-node";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        send: resolve(__dirname, "send/index.html"),
        receive: resolve(__dirname, "receive/index.html"),
      },
    },
  },
  cors: true,
  server: {
    port: 5173,
  },
  define: {
    // By default, Vite doesn't include shims for NodeJS/
    // necessary for segment analytics lib to work
    global: {},
  },
  // resolve: {
  //   alias: {
  //     crypto: "crypto-browserify",
  //     stream: "stream-browserify",
  //     events: "rollup-plugin-node-polyfills/polyfills/events",
  //   },
  // },
  plugins: [nodePolyfills({})],
  // optimizeDeps: {
  //   include: ["simple-peer", "crypto-browserify"],
  // },
});
