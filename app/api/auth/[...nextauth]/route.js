import User from "../../../../lib/models/user.model";
import Fleet from "../../../../lib/models/fleet.model";
import { connectMongoDB } from "../../../../lib/mongodb";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {},

      async authorize(credentials) {
        const { email, password } = credentials;

        try {
          await connectMongoDB();

          // 1) Try to authenticate a regular user
          const user = await User.findOne({ email });
          if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) return null;

            return {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: "user",
            };
          }

          // 2) If no user, try to authenticate a fleet account
          const fleet = await Fleet.findOne({ email });
          if (fleet) {
            const passwordMatch = await bcrypt.compare(
              password,
              fleet.password
            );
            if (!passwordMatch) return null;

            return {
              id: fleet._id.toString(),
              name: fleet.businessName,
              email: fleet.email,
              role: "fleet",
            };
          }

          // No matching account
          return null;
        } catch (error) {
          console.log("Error during authorize: ", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist role, id, and fleetId in the token when the user logs in
      if (user) {
        token.id = user.id;
        token.role = user.role || "user";
        if (user.role === "fleet") {
          token.fleetId = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Expose role, id, and fleetId on the client
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        if (token.fleetId) {
          session.user.fleetId = token.fleetId;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl, token }) {
      // If this is a fleet account, always send them to the fleet dashboard
      if (token?.role === "fleet") {
        return `${baseUrl}/fleet/dashboard`;
      }

      // Default NextAuth-style behaviour for others
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
};

const handler = (req, res) => NextAuth(req, res, authOptions);

export { authOptions, handler as GET, handler as POST };
