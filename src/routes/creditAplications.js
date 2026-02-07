const express = require('express');
const router = express.Router();
const controller = require('../controllers/creditAplicationControllers');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, authorizeRole('Admin'), controller.getAllApplications);
router.get('/my', authenticateToken, controller.getApplicationsByUser);
router.get('/:id', authenticateToken, controller.getApplicationById);
router.post('/', authenticateToken, controller.createApplication);
router.put('/:id', authenticateToken, controller.updateApplication);
router.delete('/:id', authenticateToken, controller.deleteApplication);

module.exports = router;