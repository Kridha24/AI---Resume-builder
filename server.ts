import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./src/serverApp";

const PORT = 3000;

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server mounted as middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(path.posix.join("/", "assets"), (req, res, next) => {
      // Static cache for assets
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      next();
    });
    const express = await import("express");
    app.use(express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static assets from dist/");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
