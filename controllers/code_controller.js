const Blog = require("../models/Blog");
const Code = require("../models/Code");
const AppError = require("../utils/app_error");
const catchAsync = require("../utils/catch_async");

exports.getBlogs = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const results = req.query.results * 1 || 10;
  const skip = (page - 1) * results;

  const findBlogs = await Blog.find({ status: true }).skip(skip).limit(results).sort("_id").select("-__v");

  return res.status(200).json({
    status: "success",
    results: findBlogs.length,
    data: findBlogs,
    meta: {
      page: page,
      results: results,
    },
  });
});
exports.getRelationshipCodes = catchAsync(async (req, res, next) => {
  let labels = req.query.labels;
  labels = labels.split(",");
  console.log(labels);
  const page = req.query.page * 1 || 1;
  const results = req.query.results * 1 || 10;
  const skip = (page - 1) * results;

  const findCodes = await Code.find({
    labels: { $in: labels },
    status: true,
  })
    .skip(skip)
    .limit(results)
    .sort("_id")
    .select("-__v -link");

  return res.status(200).json({
    status: "success",
    results: findCodes.length,
    data: findCodes,
    meta: {
      page: page,
      results: results,
      labels,
    },
  });
});
exports.postReactionBlogs = catchAsync(async (req, res, next) => {
  const { type, id } = req.body;

  const typeRange = ["likes", "loves", "claps", "happies"];
  if (!typeRange.includes(type)) {
    return next(new AppError("Lỗi cảm xúc! Vui lòng thử lại ", 404));
  }
  const createReactionBlogs = await Blog.findOneAndUpdate(
    { _id: id, status: true },
    {
      $inc: { [type]: 1 },
    },
    { new: true }
  ).select("-__v");

  return res.status(200).json({
    status: "success",

    data: createReactionBlogs,
    meta: {
      type,
      id,
    },
  });
});
