import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import { AuthInput } from "../components/shared/AuthInput";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useSignIn, useAuth } from "@clerk/clerk-react";
import img1 from "../assets/images/caraousel1.jpg"


export const SignInPage: React.FC = () => {
  const { navigate, triggerToast, user, authLoading, profile } = useShop();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { signOut } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!authLoading && user && profile) {
      if (profile.role === "admin") {
        // Sign out immediately if Admin tries to access User Panel
        signOut();
        triggerToast("Access Denied: Administrative accounts cannot use the User Portal.", undefined, undefined, "error");
        return;
      }
      
      const redirectPath = localStorage.getItem("redirectAfterLogin");
      if (redirectPath) {
        localStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath as any);
      } else {
        navigate('account');
      }
    }
  }, [user, authLoading, profile, signOut, navigate, triggerToast]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showCodeVerification, setShowCodeVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setErrorMsg("");

    try {
      // Create a secure login session on Clerk using the credentials
      let result = await signIn.create({
        identifier: email,
        password: password,
      });

      // 1. If it needs first factor, check if we can submit password
      if (result.status === "needs_first_factor") {
        const hasPasswordStrategy = result.supportedFirstFactors?.some(
          (factor: any) => factor.strategy === "password"
        );
        if (hasPasswordStrategy) {
          result = await signIn.attemptFirstFactor({
            strategy: "password",
            password: password,
          });
        }
      }

      // 2. If complete, activate the session immediately
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        triggerToast("Welcome back to Wen Secrets.");
        
        const redirectPath = localStorage.getItem("redirectAfterLogin");
        if (redirectPath) {
          localStorage.removeItem("redirectAfterLogin");
          navigate(redirectPath as any);
        } else {
          navigate('account');
        }
        return;
      }

      // 3. If MFA or email verification code is forced by Clerk config
      if (result.status === "needs_second_factor" || result.status === "needs_first_factor") {
        const strategy = result.status === "needs_second_factor"
          ? result.supportedSecondFactors?.[0]?.strategy
          : result.supportedFirstFactors?.find((f: any) => f.strategy !== "password")?.strategy;

        if (strategy) {
          await signIn.prepareFirstFactor({ strategy: strategy as any });
          setShowCodeVerification(true);
          triggerToast("A verification code has been sent. Please check your email.");
        } else {
          setErrorMsg("Could not verify credentials. No valid login strategy available.");
        }
      } else {
        setErrorMsg(`Authentication session is incomplete (Status: ${result.status}). Please verify your credentials or register an account.`);
      }
    } catch (err: any) {
      console.error("Clerk login error:", err);
      setErrorMsg(err.errors?.[0]?.longMessage || err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setErrorMsg("");

    try {
      let result;
      if (signIn.status === "needs_second_factor") {
        result = await signIn.attemptSecondFactor({
          strategy: (signIn.supportedSecondFactors?.[0]?.strategy || "email_code") as any,
          code: verificationCode,
        });
      } else {
        result = await signIn.attemptFirstFactor({
          strategy: (signIn.supportedFirstFactors?.find((f: any) => f.strategy !== "password")?.strategy || "email_code") as any,
          code: verificationCode,
        });
      }

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        triggerToast("Verification successful. Welcome back!");
        
        const redirectPath = localStorage.getItem("redirectAfterLogin");
        if (redirectPath) {
          localStorage.removeItem("redirectAfterLogin");
          navigate(redirectPath as any);
        } else {
          navigate('account');
        }
      } else {
        setErrorMsg("Verification code is incorrect or expired.");
      }
    } catch (err: any) {
      console.error("Clerk verification code error:", err);
      setErrorMsg(err.errors?.[0]?.longMessage || err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = () => {
    // In a real implementation this would call clerk's oauth flow
    triggerToast("Google authentication flow initiated", undefined, undefined, "info");
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left Column: High-quality luxury image (hidden on mobile) */}
     {/* Left Column: High-quality luxury image (hidden on mobile) */}
<div className="hidden lg:block relative h-screen sticky top-0">
  <img
    src={img1}
    alt="Glowing luxury hair and skin"
    referrerPolicy="no-referrer"
    className="w-full h-full object-cover"
    loading="lazy" 
  />
  <div className="absolute inset-0 bg-[#1F4D3A]/40 flex flex-col justify-center items-center p-12 text-[#FFFFFF] text-center">
    <span className="font-playfair text-[48px] font-bold tracking-widest text-white">WEN</span>
    <p className="font-sans text-[16px] text-white/90 mt-[16px] max-w-[400px]">
      Nature's Secret for Healthy Hair & Radiant Skin
    </p>
    <div className="w-[60px] h-[2px] bg-[#C9A227] mt-[24px]"></div>
  </div>
</div>

      {/* Right Column: Authentic Login Form */}
      <div className="flex flex-col justify-center px-[24px] py-[32px] sm:px-[60px] sm:py-[60px] lg:px-[80px] lg:py-[60px] bg-white text-left w-full h-full">
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Mobile head indicator logo */}
          <div className="lg:hidden flex flex-col items-center text-center mb-[32px]">
            <span className="font-playfair text-[32px] font-bold tracking-widest text-[#1F4D3A]">WEN</span>
          </div>

          <div className="space-y-1">
            <h2 className="font-playfair text-[36px] font-bold text-[#1F4D3A] tracking-wide mb-[8px]">
              Welcome Back
            </h2>
            <p className="text-[14px] text-[#6b6b6b] font-sans mb-[32px]">
              Sign in to access your orders and wishlist
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-950 rounded-xl text-xs font-sans flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-wider block">Access Denied</span>
                <p className="font-light leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Form */}
          {!showCodeVerification ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <AuthInput
                label="Email Address"
                type="email"
                id="signin-email-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="relative">
                <AuthInput
                  label="Password"
                  type="password"
                  id="signin-password-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute -top-1 right-0 text-[#C9A227] hover:underline text-[12px] font-sans cursor-pointer"
                  onClick={() => triggerToast("Password reset flow initiated", undefined, undefined, "info")}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-[16px] bg-[#0a0a0a] hover:bg-[#1F4D3A] text-white font-sans font-bold text-[13px] uppercase tracking-[1px] rounded-[12px] shadow-sm transition-all duration-300 transform hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? "Signing in..." : "Sign In"}</span>
              </button>

              <div className="flex items-center my-[24px]">
                <div className="flex-grow border-t border-[#e5e5e5]"></div>
                <span className="mx-4 text-[#6b6b6b] text-[12px]">OR</span>
                <div className="flex-grow border-t border-[#e5e5e5]"></div>
              </div>

              <button
                type="button"
                onClick={loginWithGoogle}
                className="w-full py-[14px] bg-white border-2 border-[#e5e5e5] hover:border-[#C9A227] hover:bg-[#fafafa] text-[#1a1a1a] font-sans text-[13px] rounded-[12px] transition-all flex items-center justify-center gap-[12px] cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                  <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                  <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                  <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="text-center pt-[24px]">
                <p className="text-[13px] text-[#6b6b6b] font-sans">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate('sign-up')}
                    className="text-[#C9A227] hover:underline font-bold transition-colors cursor-pointer"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <AuthInput
                label="Verification Code (Sent to Email)"
                type="text"
                id="signin-code-input"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-[16px] bg-[#0a0a0a] hover:bg-[#1F4D3A] text-white font-sans font-bold text-[13px] uppercase tracking-[1px] rounded-[12px] shadow-sm transition-all duration-300 transform hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? "Verifying..." : "Verify Code & Login"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCodeVerification(false);
                  setErrorMsg("");
                }}
                className="w-full py-[14px] bg-white border border-[#e5e5e5] hover:bg-[#fafafa] text-[#1a1a1a] font-sans text-[13px] rounded-[12px] transition-colors text-center cursor-pointer"
              >
                Back to Password Sign In
              </button>
            </form>
          )}

         
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
