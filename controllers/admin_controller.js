const Blog = require("../models/Blog");
const HistoryCode = require("../models/HistoryCode");
const HistoryUpload = require("../models/HistoryUpload");
const Comment = require("../models/Comment");
const RepComment = require("../models/RepComment");
const Code = require("../models/Code");
const User = require("../models/User");
const AppError = require("../utils/app_error");
const sendEmail = require("../utils/email");
const EmailNotify = require("../models/EmailNotify");

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
exports.uploadFile = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No file uploaded!", 404));
  }
  await HistoryUpload.create({
    account: req.user.account,
    link: req.file.path,
  });
  return res.status(200).json({
    status: "success",
    data: req.file.path,
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
  const path = req.get("referer");

  const { title, content, link, costs, images, desc, keywords, labels, dataSystem } = req.body;
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
  const getEmailsNotify = await EmailNotify.find({});
  const listSendEmail = [];
  if (getEmailsNotify.length > 0) {
    getEmailsNotify.map((item, i) => {
      const url_unsubscribe = `${path}/unsubscribe-email/${item.token}`;
      const url_post = `${path}/source-code/${result.slug}`;
      const message = `

    <div style=" width: 500px; padding: 10px;">

      <a href=${path}><img src=${dataSystem.home_logo} style="width: 40px; height: 40px" alt="Home Logo"></img></a>
      <span>Hi there,</span>
      <p>Bạn ơi! Chúng tôi vừa có bài viết nè, vào xem ngay thôi. </p>
      <p><b><a href=${url_post}>${title}</a></b> </p>

      <img src=${images[0]} style="width: 200px" alt="${title}"></img>

      <p style="font-weight:500">Thông tin liên hệ</p>
      <li>Website:  <a href=${path}>${path} </a> </li>
      <li>Zalo: <a href=${dataSystem.myself_zalo}>${dataSystem.myself_zalo_name}</a></li>
      <li>Facebook: <a href=${dataSystem.myself_fb}>${dataSystem.myself_fb_name}</a></li>
      <li>Email: ${dataSystem.myself_email}</li>
      <p>Thư này được gửi tự động, vui lòng không reply lại bất cứ thông tin gì mang tính bảo mật cá nhân</p>
      <p>Hủy đăng ký nhận thông báo mới nhất? <a href=${url_unsubscribe}>Click vào đây</a></p>
  </div>  `;
      listSendEmail.push(
        sendEmail({
          email: item.email,
          subject: "[No Reply] Bài viết mới nhất tại LT Blog",
          message,
        })
      );
    });
  }
  console.log(listSendEmail);
  await Promise.all(listSendEmail);
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
  const path = req.get("referer");

  const { title, content, images, desc, keywords, labels, dataSystem } = req.body;
  const result = await Blog.create({
    title: title,
    content: content,
    keywords: keywords,
    images: images,
    desc: desc,
    labels: labels,
  });
  const getEmailsNotify = await EmailNotify.find({});
  const listSendEmail = [];
  if (getEmailsNotify.length > 0) {
    getEmailsNotify.map((item, i) => {
      const url_unsubscribe = `${path}/unsubscribe-email/${item.token}`;
      const url_post = `${path}/blog/${result.slug}`;
      const message = `

    <div style=" width: 500px; padding: 10px;">

      <a href=${path}><img src=${dataSystem.home_logo} style="width: 40px; height: 40px" alt="Home Logo"></img></a>
      <span>Hi there,</span>
      <p>Bạn ơi! Chúng tôi vừa có bài viết nè, vào xem ngay thôi. </p>
      <p><b><a href=${url_post}>${title}</a></b> </p>

      <img src=${images[0]} style="width: 200px" alt="${title}"></img>

      <p style="font-weight:500">Thông tin liên hệ</p>
      <li>Website:  <a href=${path}>${path} </a> </li>
      <li>Zalo: <a href=${dataSystem.myself_zalo}>${dataSystem.myself_zalo_name}</a></li>
      <li>Facebook: <a href=${dataSystem.myself_fb}>${dataSystem.myself_fb_name}</a></li>
      <li>Email: ${dataSystem.myself_email}</li>
      <p>Thư này được gửi tự động, vui lòng không reply lại bất cứ thông tin gì mang tính bảo mật cá nhân</p>
      <p>Hủy đăng ký nhận thông báo mới nhất? <a href=${url_unsubscribe}>Click vào đây</a></p>
  </div>  `;
      listSendEmail.push(
        sendEmail({
          email: item.email,
          subject: "[No Reply] Bài viết mới nhất tại LT Blog",
          message,
        })
      );
    });
  }
  console.log(listSendEmail);
  await Promise.all(listSendEmail);
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
