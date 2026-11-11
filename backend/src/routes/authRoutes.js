const express = require("express");

const {
  login,
  loginConGoogle,
} = require("../controllers/authController");

const router = express.Router();

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/google
router.post("/google", loginConGoogle);

module.exports = router;
