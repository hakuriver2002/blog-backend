class ICommentRepository {
    async findByArticle(articleId, { page, limit, isAdmin }) { throw new Error('Not implemented'); }
    async findById(id) { throw new Error('Not implemented'); }
    async create(data) { throw new Error('Not implemented'); }
    async hide(id, hiddenById, reason) { throw new Error('Not implemented'); }
    async show(id) { throw new Error('Not implemented'); }
    async delete(id) { throw new Error('Not implemented'); }
}

module.exports = ICommentRepository;