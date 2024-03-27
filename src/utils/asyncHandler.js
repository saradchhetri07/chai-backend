// const asyncHandler = (fnc = async (req, res, next) => {
//   try {
//     await fnc(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });
// const asyncHandler = (fnc = async (req, res, next) => {}) => {
//   return async (req, res, next) => {
//     try {
//       await fnc(req, res, next);
//     } catch (error) {
//       console.log("async handler error");
//       next(error); // Pass the error to the error handling middleware
//     }
//   };
// };
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// const asyncHandler = (requestHandler) => {
//   (req, res, next) => {
//     // return Promise.resolve(requestHandler(req, res, next)).catch((err) =>
//     //   next(err)
//     );
//   };
// };
