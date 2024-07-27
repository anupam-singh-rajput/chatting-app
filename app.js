const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./config/db");
const { ChatRoom, Message } = require("./models/userCollection");

// Initialize express and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://asr-jnanaena-kinchit-vaakyam-paryaaptam.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Connect to the database
connectDB();

// Middleware setup
app.use(cors({ origin: "https://asr-jnanaena-kinchit-vaakyam-paryaaptam.vercel.app/", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

// Import and use routes
const userRoutes = require("./routes/users");
app.use("/api/users", userRoutes);

const verifyToken = require("./middlewares/auth");
app.use(verifyToken);

const postMessage = async (chatRoomId, sender, content) => {
  try {
    const message = new Message({
      chatRoom: chatRoomId,
      sender,
      content,
      sentAt: new Date(),
    });
    await message.save();
    return message;
  } catch (err) {
    console.error("Error saving message:", err);
    throw err;
  }
};
io.on("connection", (socket) => {
  console.log("A device connected");

  socket.on(
    "email&message&roomid",
    async ([selectedUser, inpmsg, roomid, loggedemail]) => {
      console.log(
        "Received message from",
        loggedemail,
        "to",
        selectedUser,
        "in room",
        roomid
      );

      try {
        // Save message
        const message = await postMessage(roomid, loggedemail, inpmsg);

        // Emit message to all clients in the chat room
        io.to(roomid).emit("message", message);
      } catch (err) {
        console.error("Error handling message:", err);
      }
    }
  );

  socket.on("joinRoom", (roomid) => {
    socket.join(roomid);
    console.log(`User joined room: ${roomid}`);
  });
});

// io.on("connection", (socket) => {
//   console.log("A device connected");

//   socket.on(
//     "email&message&roomid",
//     ([selectedUser, inpmsg, roomid, loggedemail]) => {
//       console.log(
//         "Received message from",
//         loggedemail,
//         "to",
//         selectedUser,
//         "in room",
//         roomid
//       );

//       // if (!roomid || !loggedemail || !inpmsg) {
//       //   return res
//       //     .status(400)
//       //     .json({ success: false, message: "All fields are required" });
//       // }

//       Message.findOneAndUpdate(
//         { chatRoom: roomid },
//         {
//           $push: {
//             messages: {
//               content: inpmsg,
//               sentAt: new Date(),
//             },
//           },
//         },
//         { new: true, upsert: true } // upsert will create a new document if it does not exist
//       )
//         .then((result) => {
//           io.emit("message", { sender: loggedemail, content: inpmsg, roomid });
//           return JSON.stringify(result);
//         })
//         .then((data) => {
//           console.log(data);
//         })
//         .catch((err) => {
//           console.error("Error saving message:", err);
//         });
//     }
//   );
// });

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
