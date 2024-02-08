import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { FastifyInstance } from 'fastify';

export async function getPoll(app: FastifyInstance) {
    app.get('/polls/:pollId', async (request, reply) => {
        try {
            const getPollParams = z.object({
                pollId: z.string().uuid(),
            });
            
            const { pollId } = getPollParams.parse(request.params);
            if (!pollId) return reply.status(400).send('Poll ID is required');
        
            const poll = await prisma.poll.findUnique({
                where: {
                    id: pollId,
                },
                include: {
                    options: {
                        select: {
                            id: true,
                            title: true,
                        }
                    }
                }, 
            });
                
            return reply.send(poll);
        } catch (error) {
            console.error(error);
            return reply.status(500).send(error);
        }
    });
}