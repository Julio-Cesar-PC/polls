import fastify from 'fastify';
import { createPoll } from './routes/create-poll';
import { getPoll } from './routes/get-poll';
import { voteOnPoll } from './routes/vote-on-poll';
import cookie from '@fastify/cookie';

const app = fastify();

app.register(cookie, {
    secret: 'dlasjndasljndaklsjbndasouhn',
    hook: 'onRequest',
});

// create a poll
app.register(createPoll);
// Return a single poll
app.register(getPoll);
// Vote on a poll
app.register(voteOnPoll);

app.listen({port: 3333}).then(() => {
    console.log('Server is running on port 3333');
});