import { Router } from "express";
import { successResponse } from "../apiResponse.js";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.json(
    successResponse({
      status: "ok"
    })
  );
});
