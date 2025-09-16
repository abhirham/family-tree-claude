"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginForm({ onSuccess, onError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Login error:", err);
      let errorMessage = "Login failed. Please check your credentials.";

      if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "Incorrect password.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      }

      setError(errorMessage);
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError("");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-airbnb-rausch to-red-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-lg">FL</span>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Welcome Back
        </h2>
        <p className="text-gray-600">Sign in to access your family tree</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-400 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 text-sm font-medium mt-1 transition-airbnb"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-airbnb-rausch focus:border-airbnb-rausch transition-airbnb bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter your email address"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-airbnb-rausch focus:border-airbnb-rausch transition-airbnb bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim() || !password.trim()}
          className="w-full bg-airbnb-rausch text-white py-3 px-4 rounded-lg font-medium shadow-airbnb hover:shadow-airbnb-hover hover:bg-red-600 transition-airbnb disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-airbnb-rausch disabled:hover:shadow-airbnb"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Signing in...
            </div>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-center text-xs text-gray-500">
          Family Lineage - Secure family tree management
        </p>
      </div>
    </div>
  );
}
