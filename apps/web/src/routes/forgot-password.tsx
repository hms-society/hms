import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordPage } from "#/ui/identity/widgets/pages/sign-in/forget-password";

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})


