import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "/";
const VERSION = "12.1.5";
const HASH_LENGTH = 10;
const OUT_DIR = "./dist";

function processFolder(folderPath) {
  const files = fs.readdirSync(folderPath);

  files.forEach((file) => {
    const filePath = path.join(folderPath, file);

    if (!fs.lstatSync(filePath).isFile()) {
      processFolder(filePath);
      return;
    }

    const fileLower = file.toLowerCase();

    if (
      fileLower.includes("pjs.vendor-") ||
      (!fileLower.includes("index.html") &&
        !fileLower.includes("pjs.") &&
        !fileLower.endsWith(".css"))
    ) {
      return;
    }

    const oldContent = fs.readFileSync(filePath, "utf-8");

    if (fileLower.includes("index.html")) {
      const newContent = oldContent.replace(
        /(["'])([^"']+\.(js|css))\1/g,
        (match, quote, subPath) => {
          if (!subPath.includes("index.js") && !subPath.includes("config.js")) {
            return `${quote}${subPath}?v=${VERSION}${quote}`;
          }
          return `${quote}${subPath}${quote}`;
        }
      );
      fs.writeFileSync(filePath, newContent);
      return;
    }

    if (fileLower.includes("pjs.ckeditor-")) {
      const newContent = oldContent.replace(
        /(["'])([^"']+\.(js))\1/g,
        (match, quote, subPath) => {
          if (subPath.includes("pjs.vendor-")) {
            return `${quote}${subPath}?v=${VERSION}${quote}`;
          }
          return `${quote}${subPath}${quote}`;
        }
      );
      fs.writeFileSync(filePath, newContent);
      return;
    }

    let newContent = oldContent
      .replace(/\.js'/g, `.js?v=${VERSION}'`)
      .replace(/\.js'\)/g, `.js?v=${VERSION}')`)
      .replace(/\.js';/g, `.js?v=${VERSION}';`)
      .replace(/\.js"/g, `.js?v=${VERSION}"`)
      .replace(/\.js"\)/g, `.js?v=${VERSION}")`)
      .replace(/\.js";/g, `.js?v=${VERSION}";`)
      .replace(/\.css'/g, `.css?v=${VERSION}'`)
      .replace(/\.css'\)/g, `.css?v=${VERSION}')`)
      .replace(/\.css"/g, `.css?v=${VERSION}"`)
      .replace(/\.css"\)/g, `.css?v=${VERSION}")`)
      .replace(/\.svg'/g, `.svg?v=${VERSION}'`)
      .replace(/\.svg"\)/g, `.svg?v=${VERSION}")`)
      .replace(/\.gif\);/g, `.gif?v=${VERSION});`)
      .replace(/\.gif'/g, `.gif?v=${VERSION}'`)
      .replace(/\.gif"\)/g, `.gif?v=${VERSION}")`)
      .replace(/\.woff2\);/g, `.woff2?v=${VERSION});`)
      .replace(/\.woff2'/g, `.woff2?v=${VERSION}'`)
      .replace(/\.woff2"\)/g, `.woff2?v=${VERSION}")`)
      .replace(/\.ttf\);/g, `.ttf?v=${VERSION});`)
      .replace(/\.ttf'/g, `.ttf?v=${VERSION}'`)
      .replace(/\.ttf"\)/g, `.ttf?v=${VERSION}")`);

    if (fileLower.includes("pas.")) {
      newContent = newContent.replace(/\.svg\);/g, `.svg?v=${VERSION});`);
    }

    fs.writeFileSync(filePath, newContent);
  });
}

export default defineConfig({
  base: BASE_URL,
  define: {
    "process.env": {},
    global: {},
  },

  plugins: [
    vue(),
    {
      name: "versioned-bundle",
      apply: "build",
      closeBundle() {
        console.log("CloseBundle Start Replace Version CDN", new Date().toLocaleTimeString());
        const distDir = path.resolve(__dirname, OUT_DIR);
        processFolder(distDir);
        console.log("CloseBundle End Replace Version CDN", new Date().toLocaleTimeString());
      },
    },
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@wasm": fileURLToPath(new URL("./src_wasm", import.meta.url)),
      "~@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json", ".html", ".vue"],
  },

  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    },
  },

  optimizeDeps: {
    exclude: ["rdp_client"],
    include: ["vue"],
  },

  experimental: {
    renderBuiltUrl(filename, { hostType, type }) {
      if (hostType === "html") {
        return `${BASE_URL}${filename}`;
      } else if (hostType === "js") {
        return { runtime: `window.__assetsPath('${filename}')` };
      } else if (hostType === "css") {
        return { relative: true };
      } else {
        return `/${type}/${hostType}/${filename}`;
      }
    },
  },

  build: {
    minify: true,
    outDir: OUT_DIR,
    sourcemap: false,
    rollupOptions: {
      output: {
        preserveModules: false,
        entryFileNames: `chunks/pjs.[name]-[hash:${HASH_LENGTH}].js`.toLowerCase(),
        chunkFileNames: `chunks/pjs.[name]-[hash:${HASH_LENGTH}].js`.toLowerCase(),
        assetFileNames: `assets/pas.[name]-[hash:${HASH_LENGTH}].[ext]`.toLowerCase(),

        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "pjs.vendor";
          }

          if (!id.endsWith(".js") && !id.endsWith(".ts")) {
            return;
          }

          const lstChunksFiles = [
          ];

          for (const chunk of lstChunksFiles) {
            if (id.includes(chunk)) {
              const parts = id.toString().split("/");
              if (parts.length > 0) {
                return parts[parts.length - 1].replace(".js", "").replace(".ts", "");
              }
              return chunk;
            }
          }
        },
      },
    },
  },

  server: {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
    },
    port: 8080,
    sourcemap: true,
  },
});
