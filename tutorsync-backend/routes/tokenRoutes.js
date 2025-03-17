const express = require("express");
const tokenController = require("../controllers/tokenController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Rutas de tokens
router.post("/users/tokens", tokenController.updateTokens);
router.get("/users/:userId/tokens", tokenController.getUserTokens);

module.exports = router;
