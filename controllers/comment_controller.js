const Comment = require("../models/Comment");
const HistoryLike = require("../models/HistoryLike");
const RepComment = require("../models/RepComment");
const Notify = require("../models/Notify");
const AppError = require("../utils/app_error");
const catchAsync = require("../utils/catch_async");

exports.getComments = catchAsync(async (req, res, next) => {
  const accountID = req.query.accountID;
  const page = req.query.page * 1 || 1;
  const results = req.query.results * 1 || 10;
  const skip = (page - 1) * results;

  const findComments = await Comment.find({
    user: { $in: [accountID] },
  })
    .skip(skip)
    .limit(results)
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
    })

    .sort("-_id")
    .select("-__v");

  return res.status(200).json({
    status: "success",
    results: findComments.length,
    length: findComments.length,
    data: findComments,
    meta: {
      page: page,
      results: results,
    },
  });
});
exports.deleteComments = catchAsync(async (req, res, next) => {
  const id = req.user._id;
  const { commentId } = req.body;
  console.log(commentId);
  const deleteCmt = Comment.findOneAndDelete({
    _id: commentId,
    user: { $in: [id] },
  });
  const deleteLike = HistoryLike.deleteMany({
    comment: { $in: [commentId] },
  });
  const deleteReply = RepComment.deleteMany({
    comment: { $in: [commentId] },
  });
  await Promise.all([deleteCmt, deleteLike, deleteReply]);
  return res.status(204).end();
});
exports.likeComments = catchAsync(async (req, res, next) => {
  const id = req.user._id;
  const { commentId, accountId, linkNotify } = req.body;
  const findComment = await Comment.find({
    _id: commentId,
  })
    .populate({
      path: "user",
      select: "-__v -password",
    })
    .populate({
      path: "reply",
      select: "-__v -password",
    });
  const checkUserLikedComment = await Comment.find({
    _id: commentId,
    likes: { $in: [accountId] },
  });

  //unlike
  if (checkUserLikedComment.length > 0) {
    await Promise.all([
      Comment.findByIdAndUpdate(commentId, {
        $pull: {
          likes: accountId,
        },
      }),
      HistoryLike.deleteOne({
        user: { $in: [id] },
        comment: { $in: [commentId] },
      }),
    ]);

    return res.status(200).json({
      status: "success",
      message: "unlike",
    });
  } else {
    if (id.toString() !== findComment[0].user[0]._id.toString()) {
      await Promise.all([
        Comment.findByIdAndUpdate(commentId, {
          $push: {
            likes: accountId,
          },
        }),
        HistoryLike.create({
          user: [id],
          comment: [commentId],
        }),
        Notify.create({
          link: linkNotify,
          account_send: [id],
          account_receive: [findComment[0].user[0]._id],
          content: `{name} vừa like comment: "${findComment[0].content}" của bạn.`,
        }),
      ]);
    } else {
      await Promise.all([
        Comment.findByIdAndUpdate(commentId, {
          $push: {
            likes: accountId,
          },
        }),
        HistoryLike.create({
          user: [id],
          comment: [commentId],
        }),
      ]);
    }
    return res.status(200).json({
      status: "success",
      message: "like",
    });
  }
});
exports.replyComments = catchAsync(async (req, res, next) => {
  const id = req.user._id;
  const { commentId, content, linkNotify } = req.body;
  const findComment = await Comment.find({
    _id: commentId,
  })
    .populate({
      path: "user",
      select: "-__v -password",
    })
    .populate({
      path: "reply",
      select: "-__v -password",
    });
  if (id.toString() === findComment[0].user[0]._id.toString()) {
    const createReplyComment = await RepComment.create({
      user: [id],
      comment: [findComment[0]._id],
      content: content,
    });
    console.log(createReplyComment);
    const updateComment = await Comment.findByIdAndUpdate(commentId, {
      $push: {
        reply: createReplyComment._id,
      },
    });

    let listSendNotifies = [];
    let listArrayCheck = [];

    const loopSendNotifies = findComment[0].reply.map((item) => {
      if (
        !checkValid(listArrayCheck, item.user[0]._id) &&
        item.user[0]._id.toString() !== findComment[0].user[0]._id.toString() &&
        item.user[0]._id.toString() !== req.user._id.toString()
      ) {
        const newNotify = Notify.create({
          link: linkNotify,
          account_send: [id],
          account_receive: [item.user[0]._id],
          content: `{name} vừa reply: "${content}" tại comment: "${findComment[0].content}" của ${findComment[0].user[0].name}.`,
        });

        listSendNotifies.push(newNotify);
        listArrayCheck.push({
          accountID: item.user[0]._id,
        });
      }
    });

    await Promise.all(listSendNotifies);
    return res.status(200).json({
      status: "success",
      message: "Thanh cong",
      data: createReplyComment,
      meta: {
        user_receive: listArrayCheck,
      },
    });
  } else {
    const createReplyComment = await RepComment.create({
      user: [id],
      comment: [findComment[0]._id],
      content: content,
    });
    console.log(createReplyComment);
    const updateComment = Comment.findByIdAndUpdate(commentId, {
      $push: {
        reply: createReplyComment._id,
      },
    });
    const sendNotify = Notify.create({
      link: linkNotify,
      account_send: [id],
      account_receive: [findComment[0].user[0]._id],
      content: `{name} vừa reply: "${content}" tại comment: "${findComment[0].content}" của bạn.`,
    });
    await Promise.all([updateComment, sendNotify]);
    let listSendNotifies = [];
    let listArrayCheck = [];

    const loopSendNotifies = findComment[0].reply.map((item) => {
      if (
        !checkValid(listArrayCheck, item.user[0]._id) &&
        item.user[0]._id.toString() !== findComment[0].user[0]._id.toString() &&
        item.user[0]._id.toString() !== req.user._id.toString()
      ) {
        const newNotify = Notify.create({
          link: linkNotify,
          account_send: [id],
          account_receive: [item.user[0]._id],
          content: `{name} vừa reply: "${content}" tại comment: "${findComment[0].content}" của ${findComment[0].user[0].name}.`,
        });

        listSendNotifies.push(newNotify);
        listArrayCheck.push({
          accountID: item.user[0]._id,
        });
      }
    });

    await Promise.all(listSendNotifies);
    return res.status(200).json({
      status: "success",
      message: "Thanh cong",
      data: createReplyComment,
      meta: {
        user_receive: listArrayCheck,
      },
    });
  }
});
const checkValid = (arr, accountID) => {
  let check = false;
  for (let i = 0; i < arr.length; i++) {
    if (accountID === arr[i].accountID) {
      check = true;
      return check;
    }
  }
  return check;
};
exports.postComments = catchAsync(async (req, res, next) => {
  const id = req.user._id;
  const { sourceId } = req.params;
  const { content, type } = req.body;
  let returnValue;
  if (type === "code") {
    returnValue = await Comment.create({
      user: [id],
      code: [sourceId],
      content: content,
    });
  } else if (type === "blog") {
    returnValue = await Comment.create({
      user: [id],
      blog: [sourceId],
      content: content,
    });
  }
  console.log(returnValue);
  return res.status(200).json({
    status: "success",
    data: returnValue,
    message: "Comment thành công",
  });
});
exports.getDetailComments = catchAsync(async (req, res, next) => {
  const { sourceId } = req.params;
  const page = req.query.page * 1 || 1;
  const results = req.query.results * 1 || 10;
  const skip = (page - 1) * results;
  const resultsData = await Comment.find({
    $or: [
      {
        code: { $in: [sourceId] },
      },
      {
        blog: { $in: [sourceId] },
      },
    ],
  })
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
    })
    .skip(skip)
    .limit(results)

    .sort("-_id")
    .select("-__v");
  return res.status(200).json({
    status: "success",
    length: resultsData.length,
    data: resultsData,
  });
});
exports.historyLikeComments = catchAsync(async (req, res, next) => {
  const id = req.user._id;
  console.log("hitory");
  const { sourceId } = req.params;
  const results = await HistoryLike.find({
    user: { $in: [id] },
  }).select(" -__v");

  return res.status(200).json({
    status: "success",
    data: results,
  });
});
