class RefreshToken {
    constructor({ id, token, userId, expiresAt }) {
        this.id = id;
        this.token = token;
        this.userId = userId;
        this.expiresAt = expiresAt;
    }

    isExpired() {
        return new Date() > this.expiresAt;
    }
}

module.exports = RefreshToken;