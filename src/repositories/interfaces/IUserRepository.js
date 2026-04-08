class IUserRepository {
    async findById(id) { throw new Error('Not implemented'); }
    async findByEmail(email) { throw new Error('Not implemented'); }
    async findAll({ role, status, search, page, limit }) { throw new Error('Not implemented'); }
    async findPending({ page, limit }) { throw new Error('Not implemented'); }
    async create(data) { throw new Error('Not implemented'); }
    async update(id, data) { throw new Error('Not implemented'); }
    async delete(id) { throw new Error('Not implemented'); }
    async createRefreshToken({ token, userId, expiresAt }) { throw new Error('Not implemented'); }
    async findRefreshToken(token) { throw new Error('Not implemented'); }
    async deleteRefreshToken(token) { throw new Error('Not implemented'); }
    async deleteAllRefreshTokensByUser(userId) { throw new Error('Not implemented'); }
}

module.exports = IUserRepository;