import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import { redis } from '../../lib/redis';
import { voutingPubSub } from '../utils/vouting-pub-sub';

export async function voteOnPoll(app: FastifyInstance) {
    app.post('/polls/:pollId/votes', async (request, reply) => {
        try {
            const voteOnPollBody = z.object({
                pollOptionId: z.string().uuid(),
            });

            const voteOnPollParams = z.object({
                pollId: z.string().uuid(),
            });
            
            const { pollOptionId } = voteOnPollBody.parse(request.body);
            const { pollId } = voteOnPollParams.parse(request.params);
            if (!pollId) return reply.status(400).send('Poll ID is required');
            if (!pollOptionId) return reply.status(400).send('Poll Option ID is required');

            let { sessionId } = request.cookies;
            if (sessionId) {
                const userPreviousVoteOnThisPoll = await prisma.vote.findUnique({
                    where: {
                        sessionId_pollId: {
                            sessionId,
                            pollId,
                        },
                    },
                });

                if (userPreviousVoteOnThisPoll && userPreviousVoteOnThisPoll.pollOptionId !== pollOptionId) {
                    await prisma.vote.delete({
                        where: {
                            id: userPreviousVoteOnThisPoll.id,
                        },
                    });
                    
                    const votes = await redis.zincrby(pollId, -1, userPreviousVoteOnThisPoll.pollOptionId);

                    voutingPubSub.publish(pollId, { 
                        pollOptionId: userPreviousVoteOnThisPoll.pollOptionId,
                        votes: Number(votes),
                    });
                } else {
                    return reply.status(400).send({ message: 'User has already voted on this poll' });
                }
            }
            if (!sessionId) {
                sessionId = randomUUID();
                reply.setCookie('sessionId', sessionId, {
                    path: '/',
                    maxAge: 60 * 60 * 24 * 7, // 1 week
                    signed: true,
                    httpOnly: true,
                });
            }

            await prisma.vote.create({
                data: {
                    sessionId,
                    pollId,
                    pollOptionId,
                },
            });

            const votes = await redis.zincrby(pollId, 1, pollOptionId);

            voutingPubSub.publish(pollId, { pollOptionId, votes: Number(votes) });
            
            return reply.status(201).send();
        } catch (error) {
            console.error(error);
            return reply.status(500).send(error);
        }
    });
}