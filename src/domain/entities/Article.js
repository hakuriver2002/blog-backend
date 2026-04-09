class Article {
    constructor({
        id,
        title,
        slug,
        content,
        category,
        status,
        authorId,
        publishedAt,
        viewCount = 0,
    }) {
        this.id = id;
        this.title = title;
        this.slug = slug;
        this.content = content;
        this.category = category;
        this.status = status;
        this.authorId = authorId;
        this.publishedAt = publishedAt;
        this.viewCount = viewCount;
    }

    isPublished() {
        return this.status === 'published';
    }

    publish() {
        this.status = 'published';
        this.publishedAt = new Date();
    }

    increaseView() {
        this.viewCount += 1;
    }
}

module.exports = Article;