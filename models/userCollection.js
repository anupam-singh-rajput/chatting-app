const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePhoto: {
    type: String,
    default: "default_profile_photo_url", // Set a default profile photo URL or leave it null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  friendRequests: [{ type: String }], // Array of emails
  friends: [{ type: String }], // Array of emails
});

const UserModel = mongoose.model("User", userSchema);

const chatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  participants: {
    type: [String],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);


// const messageSchema = new mongoose.Schema({
//   chatRoom: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "ChatRoom",
//     required: true,
//   },
//   sender: {
//     type: String,
//     required: true, // Email of the user sending the message
//   },
//   content: {
//     type: String,
//     required: true,
//   },
//   sentAt: {
//     type: Date,
//     default: Date.now,
//   },
// });


// const messageSchema = new mongoose.Schema({
//   chatRoom: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "ChatRoom", // Reference to the ChatRoom model
//     required: true,
//   },
//   messages: [
//     {
//       content: {
//         type: String,
//         required: true,
//       },
//       sentAt: {
//         type: Date,
//         default: Date.now,
//       },
//     },
//   ],
// });

// const Message = mongoose.model("Message", messageSchema);

const messageSchema = new mongoose.Schema({
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatRoom",
    required: true,
  },
  sender: {
    type: String,
    required: true, // Email of the user sending the message
  },
  content: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model("Message", messageSchema);


module.exports = { UserModel, ChatRoom, Message };
