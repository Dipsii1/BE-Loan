const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersControllers');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/',usersController.getAllUsers);
router.get('/role/:role_id', authenticateToken, usersController.getUsersByRole);
router.get('/:id', authenticateToken, usersController.getUserById);
router.put('/:id', authenticateToken, usersController.updateUser);
router.delete('/:id', authenticateToken, authorizeRole('Admin'), usersController.deleteUser);

module.exports = router;
