import fastify from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const app = fastify();
const prisma = new PrismaClient();

// create a poll
app.post('/polls', async (request, reply) => {
    try {
        const createPollBody = z.object({
            title: z.string(),
        });
        
        const { title } = createPollBody.parse(request.body);
        if (!title) return reply.status(400).send('Title is required');
    
        const poll = await prisma.poll.create({
            data: {
                title,
            },
        });
    
        console.log(`Created poll with id: ${poll.id}`);
    
        return reply.status(201).send({pollId: poll.id});
    } catch (error) {
        console.error(error);
        return reply.status(500).send(error);
    }
});

// Return a single poll
app.get('/polls/:id', async (request, reply) => {
    return { route: '/polls/:id' };
});

// Vote on a poll
app.post('/polls/:id/votes', async (request, reply) => {
    return { route: '/polls/:id/votes' };
});

app.listen({port: 3333}).then(() => {
    console.log('Server is running on port 3333');
});