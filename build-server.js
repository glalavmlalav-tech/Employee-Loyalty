import { execSync } from "child_process";

if (process.env.VERCEL || process.env.NOW_BUILDER) {
  console.log("Detected Vercel environment. Skipping compilation of Express server (server.ts).");
  process.exit(0);
}

try {
  console.log("Compiling Express server for full-stack environments...");
  execSync("esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs", { stdio: "inherit" });
  console.log("Express server compilation complete.");
} catch (error) {
  console.error("Express server compilation failed:", error);
  process.exit(1);
}
