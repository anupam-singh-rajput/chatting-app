const express = require("express");
const router = express.Router();
const {
  createUser,
  isUserExist,
  forgetHandler,
  updateHandler,
  searchUser,
  getUserData,
  showRequest,
  acceptRequest,
  addtochat,
  getFriendsDetails,
} = require("../controllers/userController");
const verifyToken = require("../middlewares/auth");

const {chatRoom} = require("../controllers/chatAndmsg");

router.post("/signup", createUser);
router.post("/login", isUserExist);
router.post("/forget", forgetHandler);
router.post("/update", updateHandler);
router.post("/search", searchUser);
router.get("/user", verifyToken, getUserData);
router.get("/friendrequests", verifyToken, showRequest);
router.post("/acceptfriendrequest", verifyToken, acceptRequest);
router.post("/add-to-chat", verifyToken, addtochat);
router.get("/getuser", verifyToken, getFriendsDetails);
router.post("/chatroom", verifyToken, chatRoom);

module.exports = router;
