class EventRegistration {
    constructor({
        id,
        eventId,
        userId,
        status = 'pending',
    }) {
        this.id = id;
        this.eventId = eventId;
        this.userId = userId;
        this.status = status;
    }

    confirm() {
        this.status = 'confirmed';
    }

    cancel() {
        this.status = 'cancelled';
    }
}

module.exports = EventRegistration;