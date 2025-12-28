const express = require('express');
const router = express.Router();
const controller = require('../controllers/applicationStatusControllers');

router.get('/', controller.getAll);
router.get('/application/:id', controller.getByApplication);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
