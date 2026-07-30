const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const AppError = require("../utils/AppError");

function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function register(req, res) {
  if (await userModel.emailExists(req.body.email)) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await userModel.createUser({
    ...req.body,
    role: "customer",
    passwordHash
  });

  res.status(201).json({
    success: true,
    message: "Customer account created successfully",
    data: publicUser(user)
  });
}

async function login(req, res) {
  const user = await userModel.findByEmail(req.body.email, true);
  const matches =
    user && (await bcrypt.compare(req.body.password, user.passwordHash));

  if (!user || !matches || !user.isActive) {
    throw new AppError(401, "Invalid email or password");
  }

  const token = jwt.sign(
    { userId: user.userId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
  );

  res.json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: publicUser(user)
    }
  });
}

module.exports = { register, login, vendorLogin: login };
