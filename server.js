require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

// =======================
// MONGO CONNECTION
// =======================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("Mongo Error:", err));

// =======================
// USER MODEL
// =======================
const User = mongoose.model("User", new mongoose.Schema({
  username: String,
  password: String
}));

// =======================
// HOME ROUTE
// =======================
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// =======================
// REGISTER
// =======================
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const exists = await User.findOne({ username });
  if (exists) return res.send("User already exists");

  const hash = await bcrypt.hash(password, 10);

  await User.create({
    username,
    password: hash
  });

  res.send("Registered successfully");
});

// =======================
// LOGIN (USER + ADMIN)
// =======================
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // ================= ADMIN LOGIN =================
  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    const token = jwt.sign(
      { admin: true, username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.send({
      message: "Admin login success",
      token
    });
  }

  // ================= USER LOGIN =================
  const user = await User.findOne({ username });
  if (!user) return res.send("User not found");

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.send("Wrong password");

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.send({
    message: "User login success",
    token
  });
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});