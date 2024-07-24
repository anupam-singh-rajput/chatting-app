const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  const token = req.cookies["token"];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }
  console.log("Hello world from Middleware");
  console.log(process.env.SECRET_KEY);
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: "Failed to authenticate token",
      });
    }

    req.email = decoded.email;
    console.log(req.email);
    console.log("End of middleware");
    next();
    console.log("Do you don't run after this");
  });
};

module.exports = verifyToken;
