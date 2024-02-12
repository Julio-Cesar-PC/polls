import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { FastifyInstance } from 'fastify';
import { redis } from '../../lib/redis';
import { BadRequestError, NotFoundError } from '../errors/errors';

export async function getPoll(app: FastifyInstance) {
    app.get('/polls/:pollId', async (request, reply) => {
        const getPollParams = z.object({
            pollId: z.string().uuid(),
        });

        if (!getPollParams.safeParse(request.params).success) {
            throw new BadRequestError('Invalid poll ID');
        }
        
        const { pollId } = getPollParams.parse(request.params);
        
    
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
        if (!poll) throw new NotFoundError('Poll not found');

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
    });
}