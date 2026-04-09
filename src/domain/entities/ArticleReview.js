class ArticleReview {
    constructor({
        id,
        articleId,
        reviewerId,
        action,
        note,
        createdAt,
    }) {
        this.id = id;
        this.articleId = articleId;
        this.reviewerId = reviewerId;
        this.action = action;
        this.note = note;
        this.createdAt = createdAt;
    }

    isApproved() {
        return this.action === 'approved';
    }

    isRejected() {
        return this.action === 'rejected';
    }
}

module.exports = ArticleReview;