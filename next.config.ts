import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DuckDB é um binário nativo: não pode passar pelo bundler, é carregado via require em runtime.
  serverExternalPackages: ["@duckdb/node-api", "@duckdb/node-bindings"],
  // Garante que o binário Linux entre no deploy da Vercel mesmo se o tracing não o detectar.
  outputFileTracingIncludes: {
    "/api/**": ["./node_modules/@duckdb/node-bindings-linux-x64/**/*"],
  },
};

export default nextConfig;
