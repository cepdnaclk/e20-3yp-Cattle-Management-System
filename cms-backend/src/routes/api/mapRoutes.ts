import { Router } from 'express';
const mapController = require('../../controller/mapController');

const router = Router();

router.get('/', mapController.getAll);

export { router as mapRouter };
