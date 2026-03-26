-- CreateEnum
CREATE TYPE "BeltColor" AS ENUM ('white', 'yellow', 'orange', 'green', 'blue', 'purple', 'red', 'brown', 'black_1dan', 'black_2dan', 'black_3dan', 'black_4dan', 'black_5dan');

-- CreateEnum
CREATE TYPE "AchievementLevel" AS ENUM ('club', 'district', 'provincial', 'national', 'regional', 'world');

-- CreateEnum
CREATE TYPE "AchievementMedal" AS ENUM ('gold', 'silver', 'bronze', 'top4', 'other');

-- CreateEnum
CREATE TYPE "AthleteDiscipline" AS ENUM ('kata', 'kumite', 'kata_team', 'kumite_team', 'both');

-- CreateTable
CREATE TABLE "athlete_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "gender" VARCHAR(10),
    "height" INTEGER,
    "weight" DOUBLE PRECISION,
    "nationality" VARCHAR(100) DEFAULT 'Việt Nam',
    "home_town" VARCHAR(200),
    "club" VARCHAR(200),
    "discipline" "AthleteDiscipline" NOT NULL DEFAULT 'both',
    "start_year" INTEGER,
    "current_belt" "BeltColor" NOT NULL DEFAULT 'white',
    "coach_name" VARCHAR(100),
    "bio" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "athlete_id" TEXT NOT NULL,
    "tournament_name" VARCHAR(300) NOT NULL,
    "discipline" "AthleteDiscipline" NOT NULL,
    "level" "AchievementLevel" NOT NULL,
    "medal" "AchievementMedal" NOT NULL,
    "year" INTEGER NOT NULL,
    "location" VARCHAR(200),
    "weight_category" VARCHAR(50),
    "kata_name" VARCHAR(100),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievement_images" (
    "id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "caption" VARCHAR(300),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "belts" (
    "id" TEXT NOT NULL,
    "athlete_id" TEXT NOT NULL,
    "belt" "BeltColor" NOT NULL,
    "achieved_at" TIMESTAMP(3) NOT NULL,
    "examiner" VARCHAR(100),
    "location" VARCHAR(200),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "belts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "athlete_profiles_user_id_key" ON "athlete_profiles"("user_id");

-- CreateIndex
CREATE INDEX "achievements_athlete_id_idx" ON "achievements"("athlete_id");

-- CreateIndex
CREATE INDEX "achievements_year_idx" ON "achievements"("year");

-- CreateIndex
CREATE INDEX "achievements_level_idx" ON "achievements"("level");

-- CreateIndex
CREATE INDEX "belts_athlete_id_idx" ON "belts"("athlete_id");

-- AddForeignKey
ALTER TABLE "athlete_profiles" ADD CONSTRAINT "athlete_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_images" ADD CONSTRAINT "achievement_images_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "belts" ADD CONSTRAINT "belts_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
