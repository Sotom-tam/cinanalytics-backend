import passport from "passport";
import pool from "../db.js";
import bcrypt from "bcrypt";
import { Strategy as LocalStrategy } from "passport-local"
import GoogleStrategy from "passport-google-oauth20";
import { storeUserEmail,getUserByEmail } from "../model/authModel.js";

passport.use(
	"local",
	new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
		try {
			const user = await getUserByEmail(email);
			//console.log("The user with that email:",user)
			if (!user) {
				return done(null, false, { message: "User not found" });
			} else {
				console.log("User Found:", user);
				return done(null, user);
			}
		} catch (error) {
			done(error);
		}
	}),
);

passport.use("google",new GoogleStrategy({
      clientID: process.env.GOOGLECLIENTID,
      clientSecret:process.env.GOOGLECLIENTSECRET,
	  callbackURL:"api/auth/google/callback"
    },
    async (accessToken,refreshToken,profile, cb) => {
      try {
        console.log(profile);
        const user = storeUserEmail(profile.email)
        if (user) {
          return cb(null, user);
        } 
      } catch (err) {
        return cb(err);
      }
}))

passport.use(
  "otp-init",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "dummy", // not used
      passReqToCallback: true,
    },
    async (req,email, dummy, done) => {
      try {
        const user = await getUserByEmail(email);
        console.log(user)
        if (!user) {
          return done(null, false, { message: "User not found" });
        }

        // attach user to session
        return done(null, user);

      } catch (err) {
        return done(err);
      }
    }
  )
);
passport.serializeUser((user, done) => {
	//console.log("User in Serialise:",user)
	done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
	try {
		// fetch user from db again
		const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
		done(null, result.rows[0]);
	} catch (err) {
		done(err);
	}
});
export default passport;
