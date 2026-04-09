class PasswordResetToken {
    constructor({ token, userId, expiresAt, used = false }) {
        this.token = token;
        this.userId = userId;
        this.expiresAt = expiresAt;
        this.used = used;
    }

    isExpired() {
        return new Date() > this.expiresAt;
    }

    markUsed() {
        this.used = true;
    }
}

module.exports = PasswordResetToken;