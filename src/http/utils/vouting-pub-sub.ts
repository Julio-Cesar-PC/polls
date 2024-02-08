
type Message = { pollOptionId: string, votes: number }
type  Subscriber = (message: Message) => void

class VoutingPubSub {
    private chanels: Record<string, Subscriber[]> = {};

    subscribe(pollId: string, subscriber: Subscriber) {
        if (!this.chanels[pollId]) {
            this.chanels[pollId] = []
        }

        this.chanels[pollId].push(subscriber)
    }

    publish(pollId: string, message: Message) {
        if (!this.chanels[pollId]) {
            return
        }

        this.chanels[pollId].forEach(subscriber => subscriber(message))
    }
}

export const voutingPubSub = new VoutingPubSub()