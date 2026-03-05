class IArticleRepository {
    async findById(id) { throw new Error('Not implemented'); }
    async findAll({ category, status, page, limit }) { throw new Error('Not implemented'); }
    async findPending({ page, limit }) { throw new Error('Not implemented'); }
    async findByAuthor(authorId) { throw new Error('Not implemented'); }
    async create(data) { throw new Error('Not implemented'); }
    async update(id, data) { throw new Error('Not implemented'); }
    async delete(id) { throw new Error('Not implemented'); }
    async incrementViewCount(id) { throw new Error('Not implemented'); }
}

module.exports = IArticleRepository;