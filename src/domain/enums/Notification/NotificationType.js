const NotificationType = Object.freeze({
    ARTICLE_APPROVED: 'article_approved',
    ARTICLE_REJECTED: 'article_rejected',
    ARTICLE_COMMENTED: 'article_commented',
    COMMENT_REPLIED: 'comment_replied',
    USER_APPROVED: 'user_approved',
    USER_PENDING: 'user_pending',
});

module.exports = NotificationType;