class User {
    constructor({ id, fullName, email, role, status, avatarUrl, createdAt }) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.status = status;
        this.avatarUrl = avatarUrl;
        this.createdAt = createdAt;
    }

    isActive() { return this.status === 'active'; }
    isAdmin() { return this.role === 'admin'; }
    isEditor() { return this.role === 'editor'; }
    isTrainer() { return this.role === 'trainer'; }
}

module.exports = User;