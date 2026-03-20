import {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  isDuplicate,
  getUserbyName,
} from "./users.js";

export function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected: ", socket.id);

    socket.on("join_room", ({ username, room }) => {
      if (isDuplicate(username, room)) {
        socket.emit("error_msg", "Username already taken");
        return;
      }

      socket.join(room);
      addUser(socket.id, username, room);

      socket.emit("join_success");
      io.to(room).emit("user_joined", `${username} joined the room`);
      io.to(room).emit("room_users", {
        users: getUsersInRoom(room),
        room,
      });
    });

    socket.on("send_message", (data) => {
      const { room } = data;
      io.to(room).emit("receive_message", data);
    });

    socket.on("private_message", ({ toUsername, message }) => {
      const sender = getUser(socket.id);
      if (!sender) return;

      const target = getUserbyName(toUsername, sender.room);
      if (!target) return;

      const [targetSocketid] = target;

      // change receive_message to private_message
      io.to(targetSocketid).emit("private_message", {
        fromUsername: sender.username,
        message,
        isSender: false,
      });

      // change receive_message to private_message
      socket.emit("private_message", {
        fromUsername: sender.username,
        toUsername,
        message,
        isSender: true,
      });
    });
    socket.on("leave_room", () => {
      const user = getUser(socket.id);
      if (user) {
        const { username, room } = user;
        socket.leave(room);
        removeUser(socket.id);
        io.to(room).emit("user_left", `${username} left the room`);
        io.to(room).emit("room_users", {
          users: getUsersInRoom(room),
          room,
        });
      }
    });

    socket.on("typing", () => {
      const user = getUser(socket.id);
      if (user) {
        socket.to(user.room).emit("typing", user.username);
      }
    });

    socket.on("stop_typing", () => {
      const user = getUser(socket.id);
      if (user) {
        socket.to(user.room).emit("stop_typing", user.username);
      }
    });

    socket.on("disconnect", () => {
      const user = getUser(socket.id);

      if (user) {
        const { username, room } = user;
        io.to(room).emit("user_left", `${username} left the room`);
        removeUser(socket.id);
        io.to(room).emit("room_users", {
          users: getUsersInRoom(room),
          room,
        });
      }
    });
  });
}
