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
import commentRoute from "./routes/comment.routes.js";
import videoRoute from "./routes/video.routes.js";
import likeRoute from "./routes/like.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRoute);
app.use("/api/v1/comment", commentRoute);
app.use("/api/v1/like", likeRoute);
// app.use("/api/v1/playlist", playlistRoute);
// app.use("/api/v1/subscription", subscriptionRoute);
// app.use("/api/v1/tweet", tweetRoute);

export { app };
