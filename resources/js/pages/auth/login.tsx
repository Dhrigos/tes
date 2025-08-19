"use client";

import { Form, Head } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/layouts/auth-layout";
import Lottie from "lottie-react";
import dolphinAnimation from "@/assets/dolphin.json"; // lokasi file dolphin.json
import { LoaderCircle } from "lucide-react";

interface LoginProps {
  status?: string;
  canResetPassword: boolean;
  errors?: any;
  processing?: boolean;
}

export default function Login({
  status,
  canResetPassword,
  errors,
  processing = false,
}: LoginProps) {
  return (
    <AuthLayout
      title="Log in to your account"
      description="Enter your email and password below to log in"
    >
      <Head title="Log in" />

      <div className="flex flex-col gap-6">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid md:grid-cols-2 p-0">
            {/* Form */}
            <Form
              method="post"
              action={route("login")}
              className="p-6 md:p-8 flex flex-col gap-6"
            >
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your account
                </p>
              </div>

              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoFocus
                  placeholder="email@example.com"
                />
                {errors?.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {canResetPassword && (
                    <a
                      href={route("password.request")}
                      className="ml-auto text-sm underline-offset-2 hover:underline"
                    >
                      Forgot password?
                    </a>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  required
                  placeholder="Password"
                />
                {errors?.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  className="h-4 w-4"
                />
                <Label htmlFor="remember">Remember me</Label>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full flex justify-center items-center gap-2 mt-2"
                disabled={processing}
              >
                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Log in
              </Button>

              {/* Divider */}
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:flex after:items-center after:border-t after:border-border">
                <span className="bg-card px-2 text-muted-foreground relative z-10">
                  Or continue with
                </span>
              </div>

              {/* Social login */}
              <div className="grid grid-cols-3 gap-4">
                <Button variant="outline" type="button" className="w-full">
                  Apple
                </Button>
                <Button variant="outline" type="button" className="w-full">
                  Google
                </Button>
                <Button variant="outline" type="button" className="w-full">
                  Meta
                </Button>
              </div>

              {/* Sign up */}
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href={route("register")} className="underline underline-offset-4">
                  Sign up
                </a>
              </div>
            </Form>

            {/* Lottie animation */}
            <div className="bg-muted relative hidden md:flex items-center justify-center">
              <Lottie
                animationData={dolphinAnimation}
                loop
                autoplay
                className="h-full w-full object-contain"
              />
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <div className="text-muted-foreground text-center text-xs text-balance">
          By clicking continue, you agree to our{" "}
          <a href="#" className="underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline">
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </AuthLayout>
  );
}
