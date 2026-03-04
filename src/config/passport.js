const passport = require("passport");
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const prisma = require('./prisma');
const { google } = require('./env');

passport.use(new GoogleStrategy({
    clientID: google.clientId,
    clientSecret: google.clientSecret,
    callbackURL: google.callbackUrl,
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;
            const fullName = profile.displayName;
            const googleId = profile.id;
            const avatarUrl = profile.photos?.[0]?.value || null;

            let user = await prisma.user.findUnique({
                where: { googleId }
            });

            if (!user) {
                user = await prisma.user.findUnique({ where: { email } });

                if (user) {
                    user = await prisma.user.update({
                        where: { email },
                        data: { googleId, avatarUrl },
                    });
                } else {
                    user = await prisma.user.create({
                        data: {
                            fullName,
                            email,
                            googleId,
                            avatarUrl,
                            role: 'member',
                            status: 'pending',
                        }
                    });
                }
            }

            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;