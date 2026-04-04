require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// ===== MONGO =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo Connected"))
  .catch(err => console.log(err));

// ===== USER MODEL =====
const User = mongoose.model("User", new mongoose.Schema({
  username: String,
  password: String,
  balance: { type: Number, default: 0 }
}));

// ===== REGISTER =====
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const exists = await User.findOne({ username });
  if (exists) return res.json({ error: "User exists" });

  const hash = await bcrypt.hash(password, 10);

  await User.create({
    username,
    password: hash,
    balance: 0
  });

  res.json({ success: true });
});

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.json({ error: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.json({ error: "Wrong password" });

  res.json({ userId: user._id });
});

// ===== BUY =====
app.post("/buy", async (req, res) => {
  const { userId, product, price } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.json({ error: "User not found" });

  if (user.balance < price) {
    return res.json({ error: "Not enough balance" });
  }

  user.balance -= price;

  const key = "NEXAA-" + Math.random().toString(36).substring(2,10).toUpperCase();

  await user.save();

  res.json({
    success: true,
    key,
    balance: user.balance
  });
});

// ===== ADMIN LOGIN =====
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    return res.json({ success: true });
  }

  res.json({ error: "Wrong admin login" });
});

// ===== ADMIN ADD BALANCE =====
app.post("/admin/add", async (req, res) => {
  const { username, amount } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.json({ error: "User not found" });

  user.balance += Number(amount);
  await user.save();

  res.json({ success: true });
});

// ===== START =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});