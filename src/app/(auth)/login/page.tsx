"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link as MuiLink,
} from "@mui/material";
import NextLink from "next/link";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const registered = searchParams.get("registered") === "true";
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    setIsSubmitting(true);

    try {
      // Use NextAuth signIn to establish the session cookie (needed for middleware page protection)
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (!result || result.error) {
        setApiError("Invalid email or password");
        setIsSubmitting(false);
        return;
      }

      // Also fetch a bearer token for client-side API calls (stored in localStorage)
      const tokenResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (tokenResponse.ok) {
        const tokenResult = await tokenResponse.json();
        if (tokenResult.data?.token) {
          localStorage.setItem("token", tokenResult.data.token);
        }
      }

      // Use window.location for a full page navigation so the new session cookie
      // is sent with the request (router.push does a soft navigation which can
      // cause the middleware to not see the freshly-set cookie)
      window.location.href = callbackUrl;
    } catch {
      setApiError("Server is unreachable. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: "bold" }} gutterBottom>
        Sign In
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Enter your credentials to access your account
      </Typography>

      {registered && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Account created successfully. Please sign in.
        </Alert>
      )}

      {apiError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          {...register("email")}
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          error={!!errors.email}
          helperText={errors.email?.message}
          autoComplete="email"
        />
        <TextField
          {...register("password")}
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          error={!!errors.password}
          helperText={errors.password?.message}
          autoComplete="current-password"
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isSubmitting}
          sx={{ mt: 2, mb: 2, minHeight: 44 }}
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
      </Box>

      <Typography variant="body2" align="center">
        Don&apos;t have an account?{" "}
        <MuiLink component={NextLink} href="/register" underline="hover">
          Sign up
        </MuiLink>
      </Typography>
    </Box>
  );
}
