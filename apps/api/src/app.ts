import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config } from "./config.js";
import { errorResponse } from "./apiResponse.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/health.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.FRONTEND_URL
  })
);
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use("/api/health", healthRouter);

app.use((_request, response) => {
  response.status(404).json(errorResponse("Not found"));
});

app.use(errorHandler);
