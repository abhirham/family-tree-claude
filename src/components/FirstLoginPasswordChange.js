"use client";

import { useState } from "react";
import { updatePassword } from "firebase/auth";
import { updateUserProfile } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";

export default function FirstLoginPasswordChange({ onSuccess }) {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field, value) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
    if (error) setError(""); // Clear error when user types
  };

  const validatePasswords = () => {
    if (!passwords.newPassword) {
      return "New password is required";
    }
    if (passwords.newPassword.length < 6) {
      return "Password must be at least 6 characters long";
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validationError = validatePasswords();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      // Update Firebase Auth password
      await updatePassword(user, passwords.newPassword);

      // Update user profile to remove mustChangePassword flag
      await updateUserProfile(user.uid, {
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error changing password:", err);
      let errorMessage = "Failed to change password. Please try again.";

      if (err.code === "auth/weak-password") {
        errorMessage =
          "Password is too weak. Please choose a stronger password.";
      } else if (err.code === "auth/requires-recent-login") {
        errorMessage =
          "Please log out and log back in, then try changing your password again.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-airbnb border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-airbnb-rausch to-red-600 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-9a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Change Your Password
            </h2>
            <p className="text-gray-600 text-sm">
              For security reasons, you must change your temporary password
              before accessing the family tree
            </p>
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
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwords.newPassword}
                  onChange={(e) => handleChange("newPassword", e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-airbnb-rausch focus:border-airbnb-rausch transition-airbnb bg-white disabled:opacity-50"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={passwords.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-airbnb-rausch focus:border-airbnb-rausch transition-airbnb bg-white disabled:opacity-50"
                placeholder="Confirm your new password"
              />
            </div>

            <button
              type="submit"
              disabled={
                loading || !passwords.newPassword || !passwords.confirmPassword
              }
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
                  Changing Password...
                </div>
              ) : (
                "Change Password & Continue"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              Your account: <span className="font-medium">{user?.email}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
