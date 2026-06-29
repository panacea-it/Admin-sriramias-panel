import dns from "node:dns";
import path from "node:path";
import { cwd } from "node:process";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Match sriram-ias-backend: avoid intermittent ENOTFOUND on Windows/corporate DNS.
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function normalizeApiHost(raw) {
  if (!raw?.trim()) return "";
  return raw
    .trim()
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");
}

const MASTER_API_PREFIXES = [
  "/api/programs",
  "/api/categories",
  "/api/sub-categories",
  "/api/subjects",
  "/api/topics",
  "/api/teachers",
  "/api/cities",
  "/api/legacy-categories",
  "/api/centers",
];

const MASTER_BULK_STATUS_PATHS = MASTER_API_PREFIXES.map(
  (prefix) => `${prefix}/bulk-status`,
);

function createDevProxy(
  target,
  { secure = false, label = target, logAuth = false } = {},
) {
  return {
    target,
    changeOrigin: true,
    secure,
    configure: (proxy) => {
      proxy.on("proxyReq", (proxyReq, req) => {
        proxyReq.removeHeader("origin");
        proxyReq.removeHeader("referer");
        if (logAuth && req.url?.includes("/auth/login")) {
          console.log(
            `[vite proxy] ${req.method} ${req.url} → ${target}${req.url}`,
          );
        }
      });
      proxy.on("error", (err, req, res) => {
        console.error(
          `[vite proxy] ${req.method} ${req.url} → ${label}: ${err.message}`,
        );
        if (res && !res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              message: `Backend unavailable at ${label}. Start the API server or update VITE_API_BASE_URL, then restart npm run dev.`,
            }),
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), "");
  const apiTarget =
    normalizeApiHost(env.VITE_API_BASE_URL) ||
    normalizeApiHost(env.VITE_API_URL) ||
    normalizeApiHost(env.VITE_BASE_URL) ||
    "https://sriramias-backend.onrender.com";

  const explicitLocalApi = normalizeApiHost(env.VITE_LOCAL_API_URL);

  const localApiTarget =
    explicitLocalApi ||
    (apiTarget.includes("localhost") || apiTarget.includes("127.0.0.1")
      ? apiTarget
      : "http://localhost:5000");

  const isHttpsTarget = apiTarget.startsWith("https://");

  // Enrollment APIs follow the remote API in dev unless a local gateway is configured.
  const enrollmentApiTarget = explicitLocalApi ? localApiTarget : apiTarget;
  const enrollmentProxySecure =
    enrollmentApiTarget === apiTarget ? isHttpsTarget : false;

  if (mode === "development") {
    console.log(
      `[vite] batch-enrollments /api/batch-enrollments → ${enrollmentApiTarget}`,
    );
    console.log(
      `[vite] bulk-status /api/* → ${localApiTarget} (optional gateway)`,
    );
    console.log(
      `[vite] other /api/* → ${apiTarget} (secure: ${isHttpsTarget})`,
    );
  }

  return {
    envPrefix: ["VITE_", "REACT_APP_"],
    base: "/",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 500,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: "vendor-react",
                test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
              },
              {
                name: "vendor-motion",
                test: /node_modules[\\/]framer-motion[\\/]/,
              },
              {
                name: "vendor-charts",
                test: /node_modules[\\/](recharts|d3-[^/]+)[\\/]/,
              },
              {
                name: "vendor-xlsx",
                test: /node_modules[\\/]xlsx[\\/]/,
              },
              {
                name: "vendor-pdf",
                test: /node_modules[\\/]pdfjs-dist[\\/]/,
              },
              {
                name: "vendor-dnd",
                test: /node_modules[\\/]@dnd-kit[\\/]/,
              },
              {
                name: "vendor-misc",
                test: /node_modules[\\/]/,
              },
            ],
          },
        },
      },
    },
    plugins: [react(), tailwindcss()],
    server: {
      warmup: {
        clientFiles: [
          "./src/routes/lazyRoute.js",
          "./src/pages/LazyLoadErrorPage.jsx",
          "./src/routes/lazyPages.js",
        ],
      },
      proxy: {
        "/api/batch-enrollments": createDevProxy(enrollmentApiTarget, {
          secure: enrollmentProxySecure,
          label: `${enrollmentApiTarget} (batch-enrollments)`,
        }),
        '/api/evaluation-oversight': createDevProxy(localApiTarget, {
          label: `${localApiTarget} (evaluation-oversight)`,
        }),
        ...Object.fromEntries(
          MASTER_BULK_STATUS_PATHS.map((path) => [
            path,
            createDevProxy(localApiTarget, {
              label: `${localApiTarget} (bulk-status gateway)`,
            }),
          ]),
        ),
        "/api": createDevProxy(apiTarget, {
          secure: isHttpsTarget,
          label: apiTarget,
          logAuth: mode === "development",
        }),
      },
    },
  };
});
