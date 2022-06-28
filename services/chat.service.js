const RepComment = require("../models/RepComment");
const System = require("../models/System");
const Comment = require("../models/Comment");
const User = require("../models/User");
const Notify = require("../models/Notify");

class SocketServices {
  connection(socket) {
    console.log("New client connected " + socket.id);
    console.log("ROOM ", _io.sockets.adapter.rooms);
    socket.on("join-room-history-likes", (userId) => {
      socket.join(userId);
      socket.room_history_likes = userId;
    });
    socket.on("send-room-history-likes", (userId) => {
      _io.sockets.in(userId).emit("send-room-history-likes");
    });
    socket.on("join-profile", (data) => {
      socket.join(data);
      socket.room_profile = data;
    });
    socket.on("join-room-comment-id", (data) => {
      socket.join(data);
    });
    socket.on("update-count-likes", (data) => {
      console.log(data);
      _io.sockets.in(data.id).emit("update-count-likes", data);
    });
    socket.on("delete-comment", (data) => {
      console.log(data);
      _io.sockets.in(data.id).emit("delete-comment", data);
    });
    socket.on("delete-rep-comment", (data) => {
      console.log(data);
      _io.sockets.in(data.room).emit("delete-rep-comment", data);
    });
    socket.on("create-rep-comment", async (data) => {
      console.log(data);
      const getRepComment = await RepComment.findOne({ _id: data.id }).populate({
        path: "user",
        select: "-__v -password",
      });
      const dataSend = {
        room: data.room,
        data: getRepComment,
      };

      _io.sockets.in(data.room).emit("create-rep-comment", dataSend);
    });
    socket.on("create-comment", async (data) => {
      console.log(data);
      const getComment = await Comment.findOne({ _id: data.id })
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

      _io.sockets.in(data.room).emit("create-comment", getComment);
    });

    socket.on("get-avatar-profile", async (data) => {
      try {
        const getUser = await User.find({
          _id: data,
        });
        if (getUser.length > 0) {
          _io.sockets.in(data).emit("update-avatar-profile", getUser[0].avatar);
        }
      } catch (err) {
        console.log(err);
      }
    });
    socket.on("update-avatar-profile", ({ idRoom, dataImage }) => {
      _io.sockets.in(idRoom).emit("update-avatar-profile", dataImage);
    });

    socket.on("join-notify", (data) => {
      socket.join(data);
      socket.room_notify = data;
    });
    socket.on("get-notify", async (data) => {
      try {
        const findNotifies = await Notify.find({
          account_receive: { $in: [data] },
        })
          .sort("-_id")
          .select("-__v")
          .populate({
            path: "account_receive",
            select: "-__v -password",
          })
          .populate({
            path: "account_send",
            select: "-__v -password",
          });

        _io.sockets.in(data).emit("send-notify", findNotifies);
      } catch (err) {
        console.log(err);
      }
    });
    socket.on("read-notify", async (data) => {
      try {
        await Notify.updateMany(
          {
            account_receive: { $in: [data] },
          },
          { status: true }
        );
        console.log(data);
        _io.in(data).emit("read-notify");
      } catch (err) {
        console.log(err);
      }
    });
    socket.on("join-room", (data) => {
      socket.join(data);
      socket.room_code = data;
    });
    socket.on("send-new-comment", async (commentID) => {
      const result = await Comment.findOne({
        _id: commentID,
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

        .sort("-_id")
        .select("-__v");
      console.log("results", result);
      _io.sockets.in(socket.id).emit("create-new-comment", result);
    });
    socket.on("get-all-comments", async (codeId) => {
      try {
        const results = await Comment.find({
          $or: [
            {
              code: { $in: [codeId] },
            },
            {
              blog: { $in: [codeId] },
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

          .sort("-_id")
          .select("-__v");
        _io.sockets.in(codeId).emit("send-all-comments", results);
      } catch (err) {
        console.log(err);
      }
    });
    socket.on("join-homepage-express", () => {
      socket.join("homepage-express");
    });
    socket.on("send-event-homepage-express", async (id) => {
      let dataReturn;
      if (id == 1) {
        dataReturn = await System.findOneAndUpdate(
          {},
          { $inc: { home_express1: 1 } },
          {
            new: true,
          }
        );
      } else if (id == 2) {
        dataReturn = await System.findOneAndUpdate(
          {},
          { $inc: { home_express2: 1 } },
          {
            new: true,
          }
        );
      } else if (id == 3) {
        dataReturn = await System.findOneAndUpdate(
          {},
          { $inc: { home_express3: 1 } },
          {
            new: true,
          }
        );
      } else if (id == 4) {
        dataReturn = await System.findOneAndUpdate(
          {},
          { $inc: { home_express4: 1 } },
          {
            new: true,
          }
        );
      } else {
        dataReturn = await System.findOneAndUpdate(
          {},
          { $inc: { home_views: 1 } },
          {
            new: true,
          }
        );
      }

      _io.sockets.in("homepage-express").emit("send-event-homepage-express", dataReturn);
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected ", socket.id);
    });
  }
}
module.exports = new SocketServices();
