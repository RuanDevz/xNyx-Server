const express = require('express');
const { Op } = require('sequelize'); 
const { User } = require('../models'); 
const bcrypt = require('bcrypt'); 
const router = express.Router();

router.post('/', async (req, res) => {
  const { token, password } = req.body;

  try {
  
    const user = await User.findOne({ 
      where: { 
        resetPasswordToken: token, 
        resetPasswordExpires: { [Op.gt]: Date.now() } 
      } 
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

  
    user.password = hashedPassword; 
    user.resetPasswordToken = null; 
    user.resetPasswordExpires = null; 
    await user.save();

    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password." });
  }
});

module.exports = router;
