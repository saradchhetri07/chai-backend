import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("process running in ");
    });
  })
  .catch((err) => {
    console.log("Mongodb connection failed");
  });

// import express from "express";
// const app = express();

// (async () => {
//   try {
//     await mongoose.connect(`{process.env.MONGO_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log(error);
//       throw error;
//     });

//     app.listen(process.env.PORT, () => {
//       console.log(`app listening to port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// })();
