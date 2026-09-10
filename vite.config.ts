import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const githubPagesBase = "/progress-forge-control-center/";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    base: env.DEPLOY_TARGET === "github-pages" ? githubPagesBase : "/",
    plugins: [react()],
  };
});
