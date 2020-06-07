import knex from '../database/connection';
import { Request, Response } from 'express';

class PointController {
    async index(request: Request, response: Response) {
        const { city, uf, items } = request.query;

        const parsedItems = String(items).split(',').map(item => Number(item.trim()));

        const points = await knex('point')
            .join('point_item', 'point.id', '=', 'point_item.point_id')
            .whereIn('point_item.item_id', parsedItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('point.*');

        return response.json(points);
    }

    async show(request: Request, response: Response) {
        const { id } = request.params;

        const point = await knex('point').select('*').where('id', id).first();

        if (!point) {
            return response.status(400).json({ message: 'Ponto inexistente.' });
        }

        const items = await knex('item')
            .join('point_item', 'item.id', '=', 'point_item.item_id')
            .where('point_id', id)
            .select('title');
        

        return response.json({point, items});
    }

    async create(request: Request, response: Response) {
        const { name, email, whatsapp, latitude, longitude, city, uf, items } = request.body;
    
        const trx = await knex.transaction();

        const point = { 
            image: 'img',
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        };
    
        const insertedPointId = await trx('point').insert(point);

        const point_id = insertedPointId[0];
    
        const pointItems = items.map((item_id: number) => {
            return {
                point_id,
                item_id
            }
        });

        await trx('point_item').insert(pointItems)
  
        await trx.commit();
      
        return response.json({ id: point_id, ...point, });
    }

}

export default PointController;