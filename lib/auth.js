import User from "./models/user.model";
import Fleet from "./models/fleet.model";
import { connectMongoDB } from "./mongodb";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {},

      async authorize(credentials) {
        const { email, password } = credentials;

        try {
          await connectMongoDB();

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
      if (token?.role === "fleet") {
        return `${baseUrl}/fleet/dashboard`;
      }

      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
};
