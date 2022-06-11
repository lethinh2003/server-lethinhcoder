const EmailNotify = require("../models/EmailNotify");
const AppError = require("../utils/app_error");
const catchAsync = require("../utils/catch_async");
const validator = require("validator");
const sendEmail = require("../utils/email");
exports.createNewEmailNotify = catchAsync(async (req, res, next) => {
  const path = req.get("referer");

  const { email, dataSystem } = req.body;
  if (!validator.isEmail(email)) {
    return next(new AppError("Email không hợp lệ", 401));
  }
  const createEmailNotify = await EmailNotify.findOneAndUpdate(
    {
      email: email,
    },
    {
      $set: {
        createdAt: new Date().toISOString(),
      },
    },
    {
      new: false,
      upsert: true,
      runValidators: true,
    }
  );

  if (createEmailNotify) {
    return next(new AppError("Email đã tồn tại", 401));
  } else {
    const message = `

    <div style=" width: 500px; padding: 10px;">

      <a href=${path}><img src=${dataSystem.home_logo} style="width: 40px; height: 40px" alt="Home Logo"></img></a>
      <span>Hi there,</span>
      <p>Lời đầu tiên xin gửi lời cảm ơn đến bạn, vì đã ghé thăm trang web của tôi. Cảm ơn bạn đã đăng ký nhận thông tin mới nhất của chúng tôi. </p>
    

      <p style="font-weight:500">Thông tin liên hệ</p>
      <li>Website:  <a href=${path}>${path} </a> </li>
      <li>Zalo: <a href=${dataSystem.myself_zalo}>${dataSystem.myself_zalo_name}</a></li>
      <li>Facebook: <a href=${dataSystem.myself_fb}>${dataSystem.myself_fb_name}</a></li>
      <li>Email: ${dataSystem.myself_email}</li>
      <p>Thư này được gửi tự động, vui lòng không reply lại bất cứ thông tin gì mang tính bảo mật cá nhân</p>
 
  </div>  `;
    const sendMail = await sendEmail({
      email: email,
      subject: "[No Reply] Đăng ký nhận thông báo thành công",
      message,
    });
    return res.status(200).json({
      status: "success",
      message: "Đăng ký nhận tin thành công!",
    });
  }
});
