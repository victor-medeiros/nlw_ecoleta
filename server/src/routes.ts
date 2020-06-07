import express from 'express';
import knex from './database/connection';
import ItemController from './controllers/ItemController';
import PointController from './controllers/PointController';

const routes = express.Router();
const itemController = new ItemController;
const pointController = new PointController;

routes.get('/items', itemController.index)

routes.post('/point', pointController.create);
routes.get('/points', pointController.index);
routes.get('/point/:id', pointController.show);

export default routes;