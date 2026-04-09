class Tag {
    constructor({
        id,
        name,
        slug,
        isActive = true,
        usageCount = 0,
    }) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.isActive = isActive;
        this.usageCount = usageCount;
    }

    increaseUsage() {
        this.usageCount += 1;
    }

    deactivate() {
        this.isActive = false;
    }
}

module.exports = Tag;