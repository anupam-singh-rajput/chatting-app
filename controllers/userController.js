const {UserModel} = require("../models/userCollection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const createUser = async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    // Check if username exists
    const existingUsername = await UserModel.findOne({ username });
    if (existingUsername) {
      return res
        .status(400)
        .json({ success: false, message: "Username already exists" });
    }

    // Check if email exists
    const existingEmail = await UserModel.findOne({ email });
    if (existingEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create user
    const user = new UserModel({ username, email, password: hash, name });
    await user.save();

    return res
      .status(201)
      .json({ success: true, message: "User created successfully", user });
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
};

const isUserExist = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const userData = { email: user.email };
      const token = jwt.sign(userData, process.env.SECRET_KEY, {
        expiresIn: "1h",
      });

      res.cookie("token", token, {
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        sameSite: "Lax", // Can be 'Strict', 'Lax', or 'None'
      });

      return res.status(200).json({
        success: true,
        message: "Authentication successful",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    console.error("Error during user authentication:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

const forgetHandler = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (user) {
      return res.status(200).json({
        success: true,
        message: "Email found",
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }
  } catch (error) {
    console.error("Error during email verification:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

const updateHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Log incoming data (Avoid logging passwords in production)
    console.log("Incoming email:", email);

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Update the user
    const updatedUser = await UserModel.findOneAndUpdate(
      { email },
      { email, password: hash },
      { new: true }
    );

    // Check if user was updated
    if (updatedUser) {
      return res.status(200).json({
        success: true,
        message: "Password changed",
        updatedUser,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }
  } catch (error) {
    console.error("Error during password update:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
  }
};

const searchUser = async (req, res) => {
  try {
    const { name } = req.body;

    // Check if username is provided
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    // Perform fuzzy search using $regex
    const allUsers = await UserModel.find({
      name: { $regex: name, $options: "i" },
    });

    // Check if users were found
    if (allUsers.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Users found",
        users: allUsers,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No users found with that username",
      });
    }
  } catch (error) {
    console.error("Error searching users:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
  }
};

const getUserData = async (req, res) => {
  try {
    console.log(req.email);
    const user = await UserModel.findOne({ email: req.email });
    if (user) {
      return res.status(200).json({
        success: true,
        user,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    console.error("Error fetching user data:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
  }
};

const showRequest = async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.email }).populate(
      "friendRequests"
    ); // Populate friend requests
    if (user) {
      // Find user details for each friend request email
      const friendRequestsDetails = await UserModel.find({
        email: { $in: user.friendRequests },
      });

      return res.status(200).json({
        success: true,
        friendRequests: friendRequestsDetails, // Return detailed friend requests
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching friend requests:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const acceptRequest = async (req, res) => {
  try {
    const { email } = req.body; // The email of the request sender
    const loggedInUserEmail = req.email; // The email of the logged-in user

    // Find the logged-in user and the friend (request sender)
    const user = await UserModel.findOne({ email: loggedInUserEmail });
    const friend = await UserModel.findOne({ email });

    if (!user || !friend) {
      return res
        .status(404)
        .json({ success: false, message: "User or friend not found" });
    }

    // Remove the request sender's email from friendRequests
    user.friendRequests = user.friendRequests.filter(
      (reqEmail) => reqEmail !== email
    );
    user.friends.push(email); // Add to friends list

    // Add the logged-in user's email to the friend's friends list
    friend.friends.push(loggedInUserEmail);

    // Save both users
    await user.save();
    await friend.save();

    return res
      .status(200)
      .json({ success: true, message: "Friend request accepted" });
  } catch (error) {
    console.error("Error accepting friend request:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const addtochat = async (req, res) => {
  try {
    console.log("Hello world addtochat");
    const { email } = req.body;
    const loggedInUserEmail = req.email;
    console.log(email, loggedInUserEmail);

    // Find the user who will receive the friend request
    const userToUpdate = await UserModel.findOne({ email });

    
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the users are already friends
    if (userToUpdate.friends.includes(loggedInUserEmail)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Check if a friend request has already been sent
    if (userToUpdate.friendRequests.includes(loggedInUserEmail)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Add the logged-in user's email to the friendRequests array
    userToUpdate.friendRequests.push(loggedInUserEmail);
    await userToUpdate.save();

    res.status(200).json({ message: "Friend request sent" });

  } catch (error) {
    console.error("Error adding friend request:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getFriendsDetails = async (req, res) => {
  try {
    const email = req.email;

    const userDetails = await UserModel.findOne({ email });
    console.log(userDetails.name);
    if (userDetails) {
      const friendEmails = userDetails.friends;
      const friendsDetails = await UserModel.find({
        email: { $in: friendEmails },
      }).select("name email profilePhoto");

      return res.status(200).json({
        success: true,
        friends: friendsDetails,
        name: userDetails.name,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No users found with that email",
      });
    }
  } catch (error) {
    console.error("Error fetching user details:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      error: error.message,
    });
  }
};

module.exports = {
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
};
