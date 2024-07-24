const { ChatRoom, Message } = require("../models/userCollection");

const createChatRoom = async (email, loggedUser) => {
  try {
    if (!email || !loggedUser) {
      throw new Error("Invalid participants");
    }

    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [email, loggedUser] },
    });
    if (!chatRoom) {
      chatRoom = new ChatRoom({
        name: `${email} & ${loggedUser}`,
        participants: [email, loggedUser],
      });
      await chatRoom.save();
    }

    return chatRoom;
  } catch (err) {
    console.error("Error finding or creating chat room:", err);
    throw err;
  }
};

// const mongoose = require("mongoose");
// const postMessage = async (id) => {
// //   console.log(id);
// //   const messageRoom = await Message.find({ chatRoom: id });
// //   console.log("messageRoom : " + messageRoom);
// try {
//   // Ensure id is an ObjectId
//   // const chatRoomId = new mongoose.Types.ObjectId(id);
//   // console.log("Converted chatRoom ID:", chatRoomId);

//   const messageRoom = await Message.find({ chatRoom: id });
//   console.log("Messages found:", messageRoom);

//   return messageRoom;
// } catch (err) {
//   console.error("Error retrieving messages:", err);
//   throw err;
// }
// };

const getMessages = async (chatRoomId) => {
  try {
    const messages = await Message.find({ chatRoom: chatRoomId }).sort({
      sentAt: 1,
    });
    return messages;
  } catch (err) {
    console.error("Error retrieving messages:", err);
    throw err;
  }
};


const chatRoom = async (req, res) => {
  const { email } = req.body;
  const loggedUser = req.email; // Make sure this is correctly populated
  console.log("Creating chat room for:", email, loggedUser);

  try {
    const chatRoom = await createChatRoom(email, loggedUser);
    console.log("chatRoom:", chatRoom);

    const messages = await getMessages(chatRoom._id);
    console.log("Messages retrieved:", messages);   
    return res.status(200).json({
      success: true,
      email: loggedUser,
      message: "Room created successfully",
      chatRoom,
      messages,
    });
  } catch (err) {
    console.error("Error creating chat room:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  chatRoom,
};