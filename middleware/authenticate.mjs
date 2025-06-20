import jwt from "jsonwebtoken";
import User from "../models/user.model.mjs";
import GenericException from "../exceptions/GenericException.mjs"; 
export const authenticate = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    if (!token) {
      return next(
        new GenericException(
          401,
          "You are not logged in! Please log in to get access."
        )
      );
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new GenericException(
          401,
          "The user belonging to this token does no longer exist."
        )
      );
    }
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new GenericException(
          401,
          "User recently changed password! Please log in again."
        )
      );
    }
    req.user = currentUser; 
    res.locals.user = currentUser; 
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return next(
        new GenericException(401, "Invalid token. Please log in again!")
      );
    }
    if (err.name === "TokenExpiredError") {
      return next(
        new GenericException(
          401,
          "Your token has expired! Please log in again."
        )
      );
    }
    next(new GenericException(401, "Authentication failed. Please log in."));
  }
};