import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";
export const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const prisma = new PrismaClient();
export const auth = betterAuth({
  plugins: [
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      success_url:
        "http://localhost:3000/order/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:3000/cart",
    }),
  ],
  database: prismaAdapter(prisma, {
    provider: "mongodb",
  }),

  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  databaseHooks: {
    user: {
      create: {
        // 當新用戶被建立時自動建立 Profile
        after: async (user) => {
          try {
            await prisma.profile.create({
              data: {
                userId: user.id,
                email: user.email,
                name: user.name || "",
                phoneNumber: "",
                gender: "",
              },
            });

            console.log(`Profile auto-created for user: ${user.id}`);
          } catch (error) {
            console.error("Failed to create profile:", error);
          }
        },
      },
    },
  },
});
