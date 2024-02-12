import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { FastifyInstance } from 'fastify';
import { BadRequestError } from '../errors/errors';

export async function createPoll(app: FastifyInstance) {
    app.post('/polls', async (request, reply) => {
        const createPollBody = z.object({
            title: z.string(),
            options: z.array(z.string()),
        });

        if (!createPollBody.safeParse(request.body).success ) {
            throw new BadRequestError('Invalid request body');
        }
        
        const { title, options } = createPollBody.parse(request.body);
        
        const poll = await prisma.poll.create({
            data: {
                title,
                options: {
                    createMany: {
                        data: options.map(option => {
                            return { title: option }
                        })
                    }
                }
            },
        });
    
        console.log(`Created poll with id: ${poll.id}`);
    
        return reply.status(201).send({pollId: poll.id});
    });
}