class Achievement {
    constructor({
        id,
        athleteId,
        tournamentName,
        level,
        medal,
        year,
    }) {
        this.id = id;
        this.athleteId = athleteId;
        this.tournamentName = tournamentName;
        this.level = level;
        this.medal = medal;
        this.year = year;
    }

    isGold() {
        return this.medal === 'gold';
    }
}

module.exports = Achievement;