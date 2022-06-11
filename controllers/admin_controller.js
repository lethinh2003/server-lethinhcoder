const Blog = require("../models/Blog");
const HistoryCode = require("../models/HistoryCode");
const Comment = require("../models/Comment");
const RepComment = require("../models/RepComment");
const Code = require("../models/Code");
const User = require("../models/User");
const AppError = require("../utils/app_error");
const catchAsync = require("../utils/catch_async");

exports.getOverview = catchAsync(async (req, res, next) => {
  const getOrders = HistoryCode.find({}).select("-__v");
  const getOrdersSuccess = HistoryCode.find({ status: "success" }).select("-__v");
  const getOrdersPending = HistoryCode.find({ status: "pending" }).select("-__v");
  const getSourcesCode = Code.find({ status: true }).select("-__v -link");
  const getUsers = User.find({ status: true }).select("-__v -password");

  await Promise.all([getOrders, getOrdersSuccess, getSourcesCode, getUsers]).then((data) => {
    return res.status(200).json({
      status: "success",
      data: [
        { key: "orders", title: "Đơn Hàng", value: data[0].length },
        { key: "ordersSuccess", title: "Thành Công", value: data[1].length },
        { key: "sourcesCode", title: "Source Code", value: data[2].length },
        { key: "users", title: "Người Dùng HĐ", value: data[3].length },
      ],
    });
  });
});
exports.getHistoryDownloadCode = catchAsync(async (req, res, next) => {
  const results = await HistoryCode.find({}).select("-__v").sort("-_id");

  return res.status(200).json({
    status: "success",
    data: results,
  });
});
exports.getSourceCodes = catchAsync(async (req, res, next) => {
  const results = await Code.find({}).select("-__v").sort("-_id");

  return res.status(200).json({
    status: "success",
    data: results,
  });
});
exports.getDetailSourceCode = catchAsync(async (req, res, next) => {
  const { codeID } = req.params;
  const result = await Code.findOne({ _id: codeID }).select("-__v").sort("-_id");

  return res.status(200).json({
    status: "success",
    data: result,
  });
});
exports.getDetailBlog = catchAsync(async (req, res, next) => {
  const { blogID } = req.params;
  const result = await Blog.findOne({ _id: blogID }).select("-__v").sort("-_id");

  return res.status(200).json({
    status: "success",
    data: result,
  });
});
exports.deleteDetailSourceCode = catchAsync(async (req, res, next) => {
  const { codeID } = req.params;
  const result = await Code.findOneAndDelete({ _id: codeID });

  return res.status(200).json({
    status: "success",
    message: "Thanh cong",
  });
});
exports.deleteDetailBlog = catchAsync(async (req, res, next) => {
  const { blogID } = req.params;
  const result = await Blog.findOneAndDelete({ _id: blogID });

  return res.status(200).json({
    status: "success",
    message: "Thanh cong",
  });
});
exports.updateDetailSourceCode = catchAsync(async (req, res, next) => {
  const { title, content, link, costs, images, id, status, desc, labels, keywords } = req.body;

  const result = await Code.findByIdAndUpdate(
    id,
    {
      title: title,
      content: content,
      link: link,
      costs: costs,
      images: images,
      status: status,
      desc: desc,
      labels: labels,
      keywords: keywords,
      updatedAt: new Date().toISOString(),
    },
    {
      new: true,
      runValidators: true,
    }
  );
  return res.status(200).json({
    status: "success",
    message: "Thanh cong",
  });
});
exports.updateDetailBlog = catchAsync(async (req, res, next) => {
  const { title, content, images, id, status, desc, labels, keywords } = req.body;

  const result = await Blog.findByIdAndUpdate(
    id,
    {
      title: title,
      content: content,

      images: images,
      status: status,
      desc: desc,
      labels: labels,
      keywords: keywords,
      updatedAt: new Date().toISOString(),
    },
    {
      new: true,
      runValidators: true,
    }
  );
  return res.status(200).json({
    status: "success",
    message: "Thanh cong",
  });
});
exports.createSourceCodes = catchAsync(async (req, res, next) => {
  const { title, content, link, costs, images, desc, keywords, labels } = req.body;
  const result = await Code.create({
    title: title,
    content: content,
    link: link,
    costs: costs,
    images: images,
    desc: desc,
    keywords: keywords,
    labels: labels,
  });
  return res.status(201).json({
    status: "success",
    message: "Tạo thành công",
  });
});
exports.getBlogs = catchAsync(async (req, res, next) => {
  const results = await Blog.find({}).select("-__v").sort("-_id");

  return res.status(200).json({
    status: "success",
    data: results,
  });
});
exports.createBlog = catchAsync(async (req, res, next) => {
  const { title, content, images, desc, keywords, labels } = req.body;
  const result = await Blog.create({
    title: title,
    content: content,
    keywords: keywords,
    images: images,
    desc: desc,
    labels: labels,
  });
  return res.status(201).json({
    status: "success",
    message: "Tạo thành công",
    data: result,
  });
});
exports.getUsers = catchAsync(async (req, res, next) => {
  const getUsers = await User.find({}).select("-__v -password").sort("-_id");
  return res.status(200).json({
    status: "success",
    data: getUsers,
  });
});
exports.getHistoryComments = catchAsync(async (req, res, next) => {
  const results = await Comment.find({})
    .select("-__v")
    .sort("-_id")
    .populate({
      path: "user",
      select: "-__v -password",
    })
    .populate({
      path: "reply",
      select: "-__v -password",
    })
    .populate({
      path: "code",
      select: "-__v -link",
    });

  return res.status(200).json({
    status: "success",
    data: results,
  });
});
exports.getHistoryRepComments = catchAsync(async (req, res, next) => {
  const results = await RepComment.find({})
    .select("-__v")
    .sort("-_id")
    .populate({
      path: "user",
      select: "-__v -password",
    })
    .populate({
      path: "comment",
      select: "-__v",
    });

  return res.status(200).json({
    status: "success",
    data: results,
  });
});
