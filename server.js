const express = require("express");
const bcrypt = require("bcryptjs");

const app = express();

app.use(express.json());

// ----------------------
// TEST ROUTE
// ----------------------
app.get("/", (req, res) => {
    res.send("Server is running 🚀");
});

// ----------------------
// REGISTER ROUTE
// ----------------------
app.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Missing username or password" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    res.json({
        message: "User registered",
        username,
        hashedPassword
    });
});

// ----------------------
// LOGIN ROUTE
// ----------------------
app.post("/login", (req, res) => {
    const { password, hashedPassword } = req.body;

    if (!password || !hashedPassword) {
        return res.status(400).json({ message: "Missing data" });
    }

    const match = bcrypt.compareSync(password, hashedPassword);

    if (match) {
        res.json({ message: "Login successful" });
    } else {
        res.status(401).json({ message: "Invalid password" });
    }
});

// ----------------------
// START SERVER (RENDER FIXED)
// ----------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});