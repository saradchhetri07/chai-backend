import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credential: true,
  })
);

// app.use((req, res, next) => {
//   console.log("Request Object Properties:");
//   for (const key in req) {
//     console.log(`${key}:`, req[key]);
//   }
//   next();
// });

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//import routers
import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter);

export { app };
