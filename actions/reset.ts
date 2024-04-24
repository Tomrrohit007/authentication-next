"use server";

import * as z from "zod";
import { ResetSchema } from "@/schemas";
import { AuthError } from "next-auth";

import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { signIn } from "@/auth";
import { getUserByEmail } from "@/data/user";
import { generatePasswordResetToken } from "@/data/tokens";

import { sendResetPasswordEmail } from "@/data/mail";
import { log } from "console";

export async function reset(values: z.infer<typeof ResetSchema>) {
  const validatedFields = ResetSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid email!" };
  }
  const { email } = validatedFields.data;
  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email) {
    return { error: "Email does not exist!" };
  }

  console.log(!existingUser.emailVerified);
  const resetPassowrdToken = await generatePasswordResetToken(
    existingUser.email,
  );
  if (resetPassowrdToken) {
    await sendResetPasswordEmail(
      resetPassowrdToken.email,
      resetPassowrdToken.token,
    );

    return { success: "Reset email send!" };
  }

  try {
    await signIn("credentials", {
      email,
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
