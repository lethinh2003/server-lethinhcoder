const Blog = require("../models/Blog");
const Code = require("../models/Code");
const HistoryCode = require("../models/HistoryCode");
const AppError = require("../utils/app_error");
const catchAsync = require("../utils/catch_async");
const sendEmail = require("../utils/email");

exports.getCodes = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const results = req.query.results * 1 || 10;
  const skip = (page - 1) * results;

  let findCodes = Code.find({ status: true }).skip(skip).limit(results).select("-link -__v");
  if (req.query.sort) {
    const arraySort = req.query.sort.split(",").join(" ");

    findCodes = findCodes.sort(arraySort);
  }
  const data = await findCodes;
  return res.status(200).json({
    status: "success",
    results: data.length,
    data: data,
    meta: {
      page: page,
      results: results,
      sort: req.query.sort,
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
    .sort("-_id")
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
  const createReactionBlogs = await Code.findOneAndUpdate(
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
exports.downloadCode = catchAsync(async (req, res, next) => {
  const { email, sourceCode, dataSystem } = req.body;

  const historyDownload = await HistoryCode.findOneAndUpdate(
    {
      code: sourceCode._id,
      account: req.user.account,
    },
    {
      content: `Download code "${sourceCode.title}" thành công`,
      status: "success",
      email: email,
    },
    {
      new: false,
      upsert: true,
    }
  );
  if (historyDownload) {
    return next(new AppError("Bạn đã download code này! ", 404));
  }
  const resultCode = await Code.findOne({
    _id: sourceCode._id,
  });
  const updateDownloadInfo = Code.findOneAndUpdate(
    {
      _id: sourceCode._id,
    },
    { $inc: { downloads: 1 } }
  );
  const message = `

  <div style=" width: 500px; padding: 10px;">

    <a href="${req.headers.referer}"><img src=${dataSystem.home_logo} style="width: 40px; height: 40px" alt="Home Logo"></a>
    <span>Hi there,</span>
    <p>Lời đầu tiên xin gửi lời cảm ơn đến bạn, vì đã ghé thăm trang web của tôi. Sau đây là thông tin download của bạn: </p>
    <li >Tên code: ${resultCode.title}</li>
    <li >Giá: ${resultCode.costs} VNĐ</li>
    <li >Link tải: ${resultCode.link}</li>
    <li >Xem chi tiết code: <a href="${req.headers.referer}source-code/${resultCode.slug}">Tại đây</a></li>

    <p style="font-weight:500">Thông tin liên hệ</p>
    <li>Website:  <a href="${req.headers.referer}">${req.headers.referer} </a> </li>
    <li>Zalo: <a href=${dataSystem.myself_zalo}>${dataSystem.myself_zalo_name}</a></li>
    <li>Facebook: <a href=${dataSystem.myself_fb}>${dataSystem.myself_fb_name}</a></li>
    <li>Email: ${dataSystem.myself_email}</li>
    <p>Thư này được gửi tự động, vui lòng không reply lại bất cứ thông tin gì mang tính bảo mật cá nhân</p>

</div>  `;

  const sendMail = sendEmail({
    email: email,
    subject: "[No Reply] Download code thành công",
    message,
  });
  await Promise.all([sendMail, updateDownloadInfo]);
  return res.status(200).json({
    status: "success",
    message: "Tải xuống code thành công, vui lòng kiểm tra mail (bao gồm spam, thùng rác,..)",
  });
});
