import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Keep legacy local upload URLs readable while new uploads use Supabase
// Storage. This can be removed after existing image URLs are migrated.
app.use("/api/uploads", express.static(path.resolve(process.cwd(), "uploads")));
app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const webRoot = path.resolve(
    process.cwd(),
    "artifacts",
    "computrade-website",
    "dist",
    "public",
  );

  app.use(express.static(webRoot));
  app.use((req, res) => {
    if (req.path.startsWith("/api")) {
      res.status(404).json({ error: "API route not found" });
      return;
    }
    res.sendFile(path.join(webRoot, "index.html"));
  });
}

export default app;
