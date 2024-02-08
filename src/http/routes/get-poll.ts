import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { FastifyInstance } from 'fastify';
import { redis } from '../../lib/redis';

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
            if (!poll) return reply.status(404).send('Poll not found');

            const redisPollVotes = await redis.zrange(pollId, 0, -1, 'WITHSCORES');

            const pollWithVotes = redisPollVotes.reduce((object, line, index) => {
                if (index % 2 === 0) {
                    const score = redisPollVotes[index + 1];
                    Object.assign(object, { [line]: Number(score) });
                }
                return object;
            }, {} as Record<string, number>);

            return reply.send({
                id: poll.id,
                title: poll.title,
                options: poll.options.map(option => {
                    return {
                        id: option.id,
                        title: option.title,
                        votes: pollWithVotes[option.id] || 0,
                    }
                }),  
            });
        } catch (error) {
            console.error(error);
            return reply.status(500).send(error);
        }
    });
}