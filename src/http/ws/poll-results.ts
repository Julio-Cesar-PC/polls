import { FastifyInstance } from "fastify";
import { z } from 'zod';
import { voutingPubSub } from "../utils/vouting-pub-sub";

export async function pollResults(app: FastifyInstance) {
    app.get('/polls/:pollId/results', {websocket: true}, async (connection, request) => {
        const gerPollParams = z.object({
            pollId: z.string().uuid(),
        });

        const { pollId } = gerPollParams.parse(request.params);
         
        voutingPubSub.subscribe(pollId, (message) => {
            connection.socket.send(JSON.stringify(message));
        });
    });

}