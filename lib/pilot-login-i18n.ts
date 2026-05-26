"use client";

import { useCallback, useSyncExternalStore } from "react";

export type PilotLoginLanguage = "en" | "hi";

const STORAGE_KEY = "pilot-login-language";

export const pilotLoginTranslations = {
  en: {
    language: "Language",
    english: "English",
    hindi: "Hindi",
    searchPlaceholder: "Search...",
    nav: {
      home: "Home",
      services: "Services",
      blogs: "Blogs",
      contact: "Contact Us",
    },
    welcomeBack: "Welcome Back",
    pilotSubtitle: "Sign in to open your pilot dashboard.",
    userSubtitle: "Sign in to your user dashboard.",
    chooseSignIn: "Choose pilot or user sign-in",
    pilotLogin: "Pilot Login",
    userLogin: "User Login",
    emailAddress: "Email Address",
    password: "Password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot Password?",
    signInPilot: "Sign in to pilot dashboard",
    signingIn: "Signing in…",
    newPilotRegister: "New Pilot Register ? Click here.",
    copyright: (year: number) =>
      `© ${year} Hire A Drone. All rights reserved.`,
    showPassword: "Show password",
    hidePassword: "Hide password",
    errors: {
      emailRequired: "Email is required.",
      emailInvalid: "Enter a valid email address.",
      passwordRequired: "Password is required.",
      emailIncorrect: "Incorrect Email id",
      passwordIncorrect: "Incorrect Password",
    },
    userForm: {
      identity: "Email or mobile number",
      password: "Password",
      otp: "OTP",
      rememberMe: "Remember me",
      forgotPassword: "Forgot Password?",
      signIn: "Sign in to user dashboard",
      signingIn: "Signing in…",
      sendOtp: "Send OTP",
      verifyOtp: "Verify & sign in",
      passwordTab: "Password",
      otpTab: "OTP",
      identityRequired: "Email or mobile number is required.",
      identityInvalid: "Enter a valid email or 10-digit mobile number.",
      passwordRequired: "Password is required.",
      otpRequired: "Enter the OTP sent to your phone or email.",
    },
    adminForm: {
      welcomeBack: "Welcome Back",
      subtitle: "Admin dashboard",
      emailAddress: "Email Address",
      password: "Password",
      rememberMe: "Remember me",
      forgotPassword: "Forgot Password?",
      signIn: "Sign in to Admin Dashboard",
      signingIn: "Signing in…",
      identityRequired: "Email is required.",
      identityInvalid: "Enter a valid email address.",
      passwordRequired: "Password is required.",
    },
  },
  hi: {
    language: "भाषा",
    english: "अंग्रेज़ी",
    hindi: "हिंदी",
    searchPlaceholder: "खोजें...",
    nav: {
      home: "होम",
      services: "सेवाएँ",
      blogs: "ब्लॉग",
      contact: "संपर्क करें",
    },
    welcomeBack: "वापसी पर स्वागत है",
    pilotSubtitle: "अपना पायलट डैशबोर्ड खोलने के लिए साइन इन करें।",
    userSubtitle: "अपने यूज़र डैशबोर्ड में साइन इन करें।",
    chooseSignIn: "पायलट या यूज़र साइन-इन चुनें",
    pilotLogin: "पायलट लॉगिन",
    userLogin: "यूज़र लॉगिन",
    emailAddress: "ईमेल पता",
    password: "पासवर्ड",
    rememberMe: "मुझे याद रखें",
    forgotPassword: "पासवर्ड भूल गए?",
    signInPilot: "पायलट डैशबोर्ड में साइन इन करें",
    signingIn: "साइन इन हो रहा है…",
    newPilotRegister: "नया पायलट पंजीकरण? यहाँ क्लिक करें।",
    copyright: (year: number) =>
      `© ${year} Hire A Drone. सर्वाधिकार सुरक्षित।`,
    showPassword: "पासवर्ड दिखाएँ",
    hidePassword: "पासवर्ड छिपाएँ",
    errors: {
      emailRequired: "ईमेल आवश्यक है।",
      emailInvalid: "मान्य ईमेल पता दर्ज करें।",
      passwordRequired: "पासवर्ड आवश्यक है।",
      emailIncorrect: "गलत ईमेल आईडी",
      passwordIncorrect: "गलत पासवर्ड",
    },
    userForm: {
      identity: "ईमेल या मोबाइल नंबर",
      password: "पासवर्ड",
      otp: "OTP",
      rememberMe: "मुझे याद रखें",
      forgotPassword: "पासवर्ड भूल गए?",
      signIn: "यूज़र डैशबोर्ड में साइन इन करें",
      signingIn: "साइन इन हो रहा है…",
      sendOtp: "OTP भेजें",
      verifyOtp: "सत्यापित करें और साइन इन करें",
      passwordTab: "पासवर्ड",
      otpTab: "OTP",
      identityRequired: "ईमेल या मोबाइल नंबर आवश्यक है।",
      identityInvalid: "मान्य ईमेल या 10 अंकों का मोबाइल नंबर दर्ज करें।",
      passwordRequired: "पासवर्ड आवश्यक है।",
      otpRequired: "अपने फ़ोन या ईमेल पर भेजा गया OTP दर्ज करें।",
    },
    adminForm: {
      welcomeBack: "वापसी पर स्वागत है",
      subtitle: "एडमिन डैशबोर्ड",
      emailAddress: "ईमेल पता",
      password: "पासवर्ड",
      rememberMe: "मुझे याद रखें",
      forgotPassword: "पासवर्ड भूल गए?",
      signIn: "एडमिन डैशबोर्ड में साइन इन करें",
      signingIn: "साइन इन हो रहा है…",
      identityRequired: "ईमेल आवश्यक है।",
      identityInvalid: "मान्य ईमेल पता दर्ज करें।",
      passwordRequired: "पासवर्ड आवश्यक है।",
    },
  },
} as const;

export type PilotLoginCopy = (typeof pilotLoginTranslations)["en"];

function isPilotLoginLanguage(value: string): value is PilotLoginLanguage {
  return value === "en" || value === "hi";
}

function readStoredLanguage(): PilotLoginLanguage {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isPilotLoginLanguage(stored)) return stored;
  } catch {
    /* ignore */
  }
  return "en";
}

let currentLanguage: PilotLoginLanguage =
  typeof window !== "undefined" ? readStoredLanguage() : "en";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentLanguage;
}

function getServerSnapshot() {
  return "en" as PilotLoginLanguage;
}

export function setPilotLoginLanguage(language: PilotLoginLanguage) {
  currentLanguage = language;
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = language === "hi" ? "hi" : "en";
  }
  emit();
}

export function initPilotLoginLanguageFromStorage() {
  currentLanguage = readStoredLanguage();
  if (typeof document !== "undefined") {
    document.documentElement.lang = currentLanguage === "hi" ? "hi" : "en";
  }
}

export function usePilotLoginLanguage() {
  const language = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const setLanguage = useCallback((next: PilotLoginLanguage) => {
    setPilotLoginLanguage(next);
  }, []);

  const copy = pilotLoginTranslations[language];

  return { language, setLanguage, copy };
}
