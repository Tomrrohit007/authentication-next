"use server";

import * as z from "zod";
import { LoginSchema } from "@/schemas";
import { AuthError } from "next-auth";

import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { signIn } from "@/auth";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/data/tokens";
import { sendVerificationEmail } from "@/data/mail";

export async function login(values: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid Field!" };
  }
  const { email, password } = validatedFields.data;
  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: "Email does not exist!" };
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(
      existingUser.email,
    );
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
    );

    return { success: "Confirmation email send!" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
    return { success: "Login success" };
  } catch (e) {
    if (e instanceof AuthError) {
      switch (e.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    throw e;
  }
}
