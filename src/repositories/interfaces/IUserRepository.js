class IUserRepository {
    async findById(id) { throw new Error('Not implemented'); }
    async findByEmail(email) { throw new Error('Not implemented'); }
    async findAll({ role, status, search, page, limit }) { throw new Error('Not implemented'); }
    async findPending({ page, limit }) { throw new Error('Not implemented'); }
    async create(data) { throw new Error('Not implemented'); }
    async update(id, data) { throw new Error('Not implemented'); }
}

module.exports = IUserRepository;