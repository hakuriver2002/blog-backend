class Notification {
    constructor({
        id,
        userId,
        type,
        title,
        body,
        isRead = false,
    }) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.body = body;
        this.isRead = isRead;
    }

    markAsRead() {
        this.isRead = true;
    }
}

module.exports = Notification;