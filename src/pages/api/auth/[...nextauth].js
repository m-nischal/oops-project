// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // user contains name/email
      await dbConnect();
      // find or create user and mark verified
      const existing = await User.findOne({ email: user.email });
      if (!existing) {
        await User.create({
          name: user.name,
          email: user.email,
          oauthProvider: "google",
          oauthId: profile.sub || profile.id,
          verified: true,
          role: "CUSTOMER" // default, frontend can offer role selection after OAuth if needed
        });
      } else if (!existing.verified) {
        existing.verified = true;
        existing.oauthProvider = "google";
        existing.oauthId = profile.sub || profile.id;
        await existing.save();
      }
      return true;
    },
    async jwt({ token, user }) {
      // token is JWT we can attach role (you might fetch it)
      if (!token.role) {
        await dbConnect();
        const u = await User.findOne({ email: token.email });
        if (u) token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.id = token.sub;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  // optional: use JSON Web Tokens
});
