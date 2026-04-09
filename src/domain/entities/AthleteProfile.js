class AthleteProfile {
    constructor({
        id,
        userId,
        discipline,
        currentBelt,
        isPublic = true,
    }) {
        this.id = id;
        this.userId = userId;
        this.discipline = discipline;
        this.currentBelt = currentBelt;
        this.isPublic = isPublic;
    }

    changeBelt(newBelt) {
        this.currentBelt = newBelt;
    }

    isVisible() {
        return this.isPublic;
    }
}

module.exports = AthleteProfile;