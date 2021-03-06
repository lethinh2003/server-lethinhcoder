const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const AppError = require("../utils/app_error");
const catchAsync = require("../utils/catch_async");
const factory = require("./handle_factory");
const { json } = require("body-parser");
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};
exports.getUser = catchAsync(async (req, res, next) => {
  const { account } = req.query;
  if (!account) {
    return res.status(401).json({
      status: "fail",
      message: "Vui lòng nhập thông tin",
    });
  }

  const user = await User.findOne({ account: account }).select("-password -__v");
  if (!user) {
    return res.status(404).json({
      status: "fail",
      message: `Không tồn tại tài khoản: ${account}`,
    });
  }
  return res.status(200).json({
    status: "success",
    data: user,
  });
});

exports.getDetailUser = catchAsync(async (req, res, next) => {
  const { account } = req.body;
  if (!account) {
    return next(new AppError("Vui lòng nhập thông tin", 404));
  }
  if (req.user.account !== account) {
    return next(new AppError("Có lỗi xảy ra khi lấy thông tin tài khoản", 404));
  }
  const user = await User.findOne({ account: account }).select("-password -__v");
  return res.status(200).json({
    status: "success",
    data: user,
  });
});
exports.createUser = catchAsync(async (req, res, next) => {
  console.log("wtf");
  const { account, password, confirmPassword, name } = req.body;
  console.log(req.body);
  const result = await User.create({
    account: account,
    password: password,
    confirmPassword: confirmPassword,
    name: name,
  });
  return res.status(201).json({
    status: "success",
    message: "Đăng ký tài khoản thành công. Vui lòng đăng nhập",
    data: result,
  });
});

exports.uploadAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return res.status(401).json({
      status: "fail",
      message: `Không file nào được chọn!`,
    });
  }
  return res.status(200).json({
    status: "success",
    data: req.file.path,
  });
});
exports.updateUser = catchAsync(async (req, res, next) => {
  const id = req.user._id;
  const user = await User.findOneAndUpdate(
    {
      _id: id,
    },
    {
      avatar: req.body.avatar,
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password -__v ");

  if (!user) {
    return res.status(404).json({
      status: "fail",
      message: `Không tồn tại tài khoản này`,
    });
  }
  return res.status(200).json({
    status: "success",
    data: user,
  });
});

exports.login = async (req, res) => {
  const { account, password } = req.body;
  if (!account || !password) {
    return res.status(404).json({
      status: "err",
      message: "fill in account and password",
    });
  }
  const user = await User.findOne({ account: account });
  if (!user) {
    return res.status(404).json({
      status: "err",
      message: "account invalid",
    });
  }
  const correct = await user.correctPassword(password, user.password);
  if (!correct) {
    return res.status(404).json({
      status: "err",
      message: "password invalid",
    });
  }
  req.user = user;
  const token = signToken(user._id);
  return res.status(200).json({
    status: "success",
    token,
  });
};

exports.test = async (req, res) => {
  return res.status(200).json({
    status: "success",
    data: req.user,
  });
};

exports.getAllUsers = async (req, res) => {
  try {
    const queryObj = { ...req.query };
    //filtering
    const excludeFields = ["page", "limit", "sort", "fields"];
    excludeFields.forEach((item) => delete queryObj[item]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    queryNewObj = JSON.parse(queryStr);
    let query = User.find(queryNewObj);
    //Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("info.createdAt");
    }
    //limit fields
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v -artists._id -genres._id -info._id");
      // - tien to de k muon hien ra screen
    }
    //pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
    if (req.query.page) {
      const numUsers = await User.countDocuments();
      console.log(req.query);
      console.log(numUsers, skip);
      if (numUsers < skip) {
        throw new Error("Page doesn't exist");
      }
    }
    //Execute
    const users = await query;
    res.status(200).json({
      status: "success",
      result: users.length,
      page: page,
      limit: limit,
      data: {
        users,
      },
    });
  } catch {
    res.status(404).json({
      status: "err",
      message: "Error",
    });
  }
};
// exports.getMusic = async (req, res) => {
//   try {
//     const music = await Music.findById(req.params.id);
//     res.status(200).json({
//       status: "success",
//       data: {
//         music,
//       },
//     });
//   } catch {
//     res.status(404).json({
//       status: "err",
//       message: "Error",
//     });
//   }
// };
// exports.updateMusic = async (req, res) => {
//   try {
//     const music = await Music.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });
//     res.status(200).json({
//       status: "success",
//       data: {
//         music,
//       },
//     });
//   } catch {
//     res.status(404).json({
//       status: "err",
//       message: "Error",
//     });
//   }
// };
// exports.deleteMusic = async (req, res) => {
//   try {
//     await Music.findByIdAndDelete(req.params.id);
//     res.status(204).json({
//       status: "success",
//       message: "Deleted",
//     });
//   } catch {
//     res.status(400).json({
//       status: "err",
//       message: "Error",
//     });
//   }
// };
