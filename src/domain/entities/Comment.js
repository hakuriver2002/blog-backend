class Comment {
    constructor({
        id,
        articleId,
        userId,
        content,
        status = 'visible',
        parentId = null,
    }) {
        this.id = id;
        this.articleId = articleId;
        this.userId = userId;
        this.content = content;
        this.status = status;
        this.parentId = parentId;
    }

    isVisible() {
        return this.status === 'visible';
    }

    hide(reason) {
        this.status = 'hidden';
        this.hiddenReason = reason;
    }
}

module.exports = Comment;