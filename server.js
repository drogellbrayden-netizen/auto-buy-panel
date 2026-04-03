require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

const User = require("./models/User");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// CONNECT DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// REGISTER
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const exists = await User.findOne({ username });
  if (exists) return res.json({ error: "User exists" });

  const hash = await bcrypt.hash(password, 10);

  await User.create({ username, password: hash, balance: 0 });

  res.json({ success: true });
});

// LOGIN
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.json({ error: "No user" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.json({ error: "Wrong password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.json({ token, userId: user._id });
});

// GET USER
app.get("/me/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});

// ADMIN ADD BALANCE
app.post("/admin/add", async (req, res) => {
  const { username, amount, key } = req.body;

  if (key !== process.env.ADMIN_USER)
    return res.json({ error: "Not admin" });

  const user = await User.findOne({ username });
  if (!user) return res.json({ error: "No user" });

  user.balance += Number(amount);
  await user.save();

  res.json({ success: true });
});

// HOME PAGE FIX (THIS IS THE IMPORTANT PART)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));