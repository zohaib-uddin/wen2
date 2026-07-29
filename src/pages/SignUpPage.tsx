import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import { AuthInput } from "../components/shared/AuthInput";
import { ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
import { useSignUp } from "@clerk/clerk-react";
import img1 from "../assets/images/caraousel2.jpg"

export const SignUpPage: React.FC = () => {
  const { navigate, triggerToast, user, authLoading, profile } = useShop();
  const { isLoaded, signUp, setActive } = useSignUp();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!authLoading && user) {
      const redirectPath = localStorage.getItem("redirectAfterLogin");
      if (profile && profile.role === "admin") {
        localStorage.removeItem("redirectAfterLogin");
        navigate('admin');
      } else if (redirectPath) {
        localStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath as any);
      } else {
        navigate('shop');
      }
    }
  }, [user, authLoading, profile]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    setErrorMsg("");

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Store phone number and full name in sessionStorage so we can sync them on login/activation
      sessionStorage.setItem("wen_signup_phone", phone || "N/A");
      sessionStorage.setItem("wen_signup_fullname", fullName);

      // 1. Create signup session on Clerk
      await signUp.create({
        emailAddress: email,
        password: password,
        firstName,
        lastName,
      });

      // 2. Prepare email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      triggerToast("Verification code has been dispatched to your email address.");
    } catch (err: any) {
      console.error("Clerk signup error:", err);
      setErrorMsg(err.errors?.[0]?.longMessage || err.message || "Failed to initiate membership registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setErrorMsg("");

    try {
      // 3. Attempt to verify email code on Clerk
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status === "complete") {
        // 4. Set session active on Clerk
        await setActive({ session: completeSignUp.createdSessionId });

        const fullName = sessionStorage.getItem("wen_signup_fullname") || `${firstName} ${lastName}`;
        const storedPhone = sessionStorage.getItem("wen_signup_phone") || phone || "N/A";

        // 5. Instantly call our dynamic sync profile API to register in Supabase safely with service role bypass
        try {
          await fetch("/api/sync-profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              clerk_id: completeSignUp.createdUserId,
              email: email,
              full_name: fullName,
              phone: storedPhone,
              avatar_url: ""
            }),
          });
        } catch (syncErr) {
          console.warn("Could not sync profile during signup:", syncErr);
        }

        triggerToast("Exclusive private membership initiated successfully!");
        const redirectPath = localStorage.getItem("redirectAfterLogin");
        if (redirectPath) {
          localStorage.removeItem("redirectAfterLogin");
          navigate(redirectPath as any);
        } else {
          navigate('shop');
        }
      } else {
        setErrorMsg("Email verification status not complete. Please check the code.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setErrorMsg(err.errors?.[0]?.longMessage || err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const signupWithGoogle = () => {
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
    alt="Luxury ingredients saffron formulation"
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

      {/* Right Column: Register Form / Verification Form */}
      <div className="flex flex-col justify-center px-[24px] py-[32px] sm:px-[60px] sm:py-[60px] lg:px-[80px] lg:py-[60px] bg-white text-left w-full h-full">
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Mobile indicator logo */}
          <div className="lg:hidden flex flex-col items-center text-center mb-[32px]">
            <span className="font-playfair text-[32px] font-bold tracking-widest text-[#1F4D3A]">WEN</span>
          </div>

          {!pendingVerification ? (
            <>
              <div className="space-y-1">
                <h2 className="font-playfair text-[36px] font-bold text-[#1F4D3A] tracking-wide mb-[8px]">
                  Create Account
                </h2>
                <p className="text-[14px] text-[#6b6b6b] font-sans mb-[32px]">
                  Join the Wen family for exclusive benefits
                </p>
              </div>

              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-950 rounded-xl text-xs font-sans flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold uppercase tracking-wider block">Registration Error</span>
                    <p className="font-light leading-relaxed">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-4">
                  <AuthInput
                    label="First Name"
                    type="text"
                    id="signup-fname-input"
                    placeholder="Sarah"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <AuthInput
                    label="Last Name"
                    type="text"
                    id="signup-lname-input"
                    placeholder="Khan"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>

                <AuthInput
                  label="Email Address"
                  type="email"
                  id="signup-email-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <AuthInput
                  label="Phone Number"
                  type="tel"
                  id="signup-phone-input"
                  placeholder="03XX XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />

                <AuthInput
                  label="Password"
                  type="password"
                  id="signup-password-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <AuthInput
                  label="Confirm Password"
                  type="password"
                  id="signup-confirm-password-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                {/* Terms check */}
                <div className="flex items-start text-[12px] font-sans text-[#6b6b6b] pt-2 pb-2">
                  <label className="flex gap-2 items-start cursor-pointer select-none">
                    <input
                      type="checkbox"
                      required
                      className="rounded border-[#e5e5e5] text-[#C9A227] focus:ring-[#C9A227] w-4 h-4 mt-0.5 cursor-pointer accent-[#C9A227]"
                    />
                    <span>
                      I agree to the Terms of Service &amp; Privacy Policy.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-[16px] bg-[#0a0a0a] hover:bg-[#1F4D3A] text-white font-sans font-bold text-[13px] uppercase tracking-[1px] rounded-[12px] shadow-sm transition-all duration-300 transform hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? "Creating..." : "Sign Up"}</span>
                </button>
                
                <div className="flex items-center my-[24px]">
                  <div className="flex-grow border-t border-[#e5e5e5]"></div>
                  <span className="mx-4 text-[#6b6b6b] text-[12px]">OR</span>
                  <div className="flex-grow border-t border-[#e5e5e5]"></div>
                </div>

                <button
                  type="button"
                  onClick={signupWithGoogle}
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

              </form>
            </>
          ) : (
            <>
              <div className="space-y-1 text-center lg:text-left">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-3 text-[#1F4D3A]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="font-playfair text-[28px] font-bold text-[#1F4D3A] tracking-wide mb-[8px]">
                  Verify Email
                </h2>
                <p className="text-[14px] text-[#6b6b6b] font-sans">
                  We've sent a code to <span className="font-semibold">{email}</span>
                </p>
              </div>

              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-950 rounded-xl text-xs font-sans flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-left">
                    <span className="font-bold uppercase tracking-wider block">Verification Error</span>
                    <p className="font-light leading-relaxed">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Verification Code Form */}
              <form onSubmit={handleVerify} className="space-y-5">
                <AuthInput
                  label="Enter 6-Digit Passcode"
                  type="text"
                  id="signup-verification-code"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-[16px] bg-[#0a0a0a] hover:bg-[#1F4D3A] text-white font-sans font-bold text-[13px] uppercase tracking-[1px] rounded-[12px] shadow-sm transition-all duration-300 transform hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? "Verifying..." : "Verify & Complete"}</span>
                </button>
              </form>

              <div className="text-center pt-[16px]">
                <button
                  type="button"
                  onClick={() => setPendingVerification(false)}
                  className="text-[#6b6b6b] hover:text-[#1a1a1a] text-[13px] hover:underline transition-all cursor-pointer"
                >
                  ← Go Back
                </button>
              </div>
            </>
          )}

          {/* Navigation to sign in */}
          {!pendingVerification && (
            <div className="text-center pt-[24px]">
              <p className="text-[13px] text-[#6b6b6b] font-sans">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate('sign-in')}
                  className="text-[#C9A227] hover:underline font-bold transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
