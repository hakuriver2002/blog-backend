class Event {
    constructor({
        id,
        title,
        slug,
        status,
        startDate,
        endDate,
        createdById,
    }) {
        this.id = id;
        this.title = title;
        this.slug = slug;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.createdById = createdById;
    }

    isOpen() {
        return this.status === 'published';
    }

    isOngoing() {
        const now = new Date();
        return now >= this.startDate && now <= this.endDate;
    }
}

module.exports = Event;