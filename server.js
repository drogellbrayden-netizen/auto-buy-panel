require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

// =======================
// MONGO
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
// HOME PAGE (REAL WEBSITE)
// =======================
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Auto Buy Panel</title>
        <style>
          body {
            font-family: Arial;
            background: #0f172a;
            color: white;
            text-align: center;
            padding-top: 80px;
          }
          input, button {
            padding: 10px;
            margin: 5px;
            border-radius: 5px;
            border: none;
          }
          button {
            cursor: pointer;
            background: #2563eb;
            color: white;
          }
        </style>
      </head>

      <body>
        <h1>Auto Buy Panel 🚀</h1>
        <p>Server is running</p>

        <h2>Register</h2>
        <input id="ruser" placeholder="username" />
        <input id="rpass" type="password" placeholder="password" />
        <button onclick="register()">Register</button>

        <h2>Login</h2>
        <input id="luser" placeholder="username" />
        <input id="lpass" type="password" placeholder="password" />
        <button onclick="login()">Login</button>

        <p id="msg"></p>

        <script>
          async function register() {
            const res = await fetch('/register', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                username: document.getElementById('ruser').value,
                password: document.getElementById('rpass').value
              })
            });
            document.getElementById('msg').innerText = await res.text();
          }

          async function login() {
            const res = await fetch('/login', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                username: document.getElementById('luser').value,
                password: document.getElementById('lpass').value
              })
            });
            document.getElementById('msg').innerText = await res.text();
          }
        </script>
      </body>
    </html>
  `);
});

// =======================
// REGISTER
// =======================
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const exists = await User.findOne({ username });
  if (exists) return res.send("User already exists");

  const hash = await bcrypt.hash(password, 10);

  await User.create({ username, password: hash });

  res.send("Registered successfully");
});

// =======================
// LOGIN
// =======================
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.send("User not found");

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.send("Wrong password");

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h"
  });

  res.send("Login success | token: " + token);
});

// =======================
// START
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));