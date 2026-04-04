require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
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

// ===== MODELS =====
const User = mongoose.model("User", new mongoose.Schema({
  username: String,
  password: String,
  balance: { type: Number, default: 0 }
}));

const Product = mongoose.model("Product", new mongoose.Schema({
  name: String,
  price: Number,
  keys: [String]
}));

// ===== REGISTER =====
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const exists = await User.findOne({ username });
  if (exists) return res.json({ error: "User exists" });

  const hash = await bcrypt.hash(password, 10);

  await User.create({ username, password: hash });

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

// ===== GET BALANCE =====
app.get("/balance/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json({ balance: user.balance });
});

// ===== GET PRODUCTS =====
app.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// ===== BUY =====
app.post("/buy", async (req, res) => {
  const { userId, productId } = req.body;

  const user = await User.findById(userId);
  const product = await Product.findById(productId);

  if (!user || !product) return res.json({ error: "Error" });

  if (user.balance < product.price) {
    return res.json({ error: "Not enough balance" });
  }

  if (product.keys.length === 0) {
    return res.json({ error: "Out of stock" });
  }

  const key = product.keys.shift();

  user.balance -= product.price;

  await user.save();
  await product.save();

  res.json({ success: true, key, balance: user.balance });
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

// ===== ADD BALANCE =====
app.post("/admin/add-balance", async (req, res) => {
  const { username, amount } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.json({ error: "User not found" });

  user.balance += Number(amount);
  await user.save();

  res.json({ success: true });
});

// ===== CREATE PRODUCT =====
app.post("/admin/create-product", async (req, res) => {
  const { name, price } = req.body;

  const exists = await Product.findOne({ name });
  if (exists) return res.json({ error: "Product exists" });

  await Product.create({ name, price, keys: [] });

  res.json({ success: true });
});

// ===== ADD KEY =====
app.post("/admin/add-key", async (req, res) => {
  const { productId, key } = req.body;

  const product = await Product.findById(productId);
  if (!product) return res.json({ error: "Product not found" });

  product.keys.push(key);
  await product.save();

  res.json({ success: true });
});

// ===== START =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});