"use client";

import { useState, useEffect } from "react";
import { getAllUsers, createBranchFromMember } from "@/lib/firestore";
import AutoComplete from "./AutoComplete";

export default function AssignAdminModal({
  isOpen,
  onClose,
  selectedMember,
  onSuccess,
}) {
  const [adminType, setAdminType] = useState("new"); // 'new' or 'existing'
  const [newAdminData, setNewAdminData] = useState({
    email: "",
    tempPassword: "",
  });
  const [existingUsers, setExistingUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchExistingUsers();
      // Reset form when modal opens
      setAdminType("new");
      setNewAdminData({ email: "", tempPassword: "" });
      setSelectedUser("");
      setError("");
    }
  }, [isOpen]);

  const fetchExistingUsers = async () => {
    try {
      const users = await getAllUsers();
      setExistingUsers(users);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const generateTempPassword = () => {
    const password =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8);
    setNewAdminData((prev) => ({ ...prev, tempPassword: password }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let adminData;

      if (adminType === "new") {
        if (!newAdminData.email || !newAdminData.tempPassword) {
          throw new Error("Email and password are required for new admin");
        }
        adminData = {
          isExisting: false,
          email: newAdminData.email,
          tempPassword: newAdminData.tempPassword,
        };
      } else {
        if (!selectedUser) {
          throw new Error("Please select an existing user");
        }
        const user = existingUsers.find((u) => u.id === selectedUser);
        adminData = {
          isExisting: true,
          uid: user.uid,
          email: user.email,
        };
      }

      const result = await createBranchFromMember(selectedMember.id, adminData);

      if (onSuccess) {
        onSuccess({
          branchId: result.branchId,
          adminUid: result.adminUid,
          memberCount: result.branchMemberIds.length,
          adminEmail:
            adminType === "new"
              ? newAdminData.email
              : existingUsers.find((u) => u.id === selectedUser)?.email,
        });
      }

      onClose();
    } catch (err) {
      console.error("Error assigning admin:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !selectedMember) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-lg shadow-airbnb border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Assign Branch Admin
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Create a branch starting from{" "}
                <span className="font-medium text-airbnb-rausch">
                  {selectedMember.name}
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-airbnb"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
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

            {/* Admin Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Admin Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="new"
                    checked={adminType === "new"}
                    onChange={(e) => setAdminType(e.target.value)}
                    className="mr-2 text-airbnb-rausch focus:ring-airbnb-rausch"
                  />
                  <span className="text-sm font-medium">Create New Admin</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="existing"
                    checked={adminType === "existing"}
                    onChange={(e) => setAdminType(e.target.value)}
                    className="mr-2 text-airbnb-rausch focus:ring-airbnb-rausch"
                  />
                  <span className="text-sm font-medium">
                    Assign Existing User
                  </span>
                </label>
              </div>
            </div>

            {adminType === "new" ? (
              /* New Admin Form */
              <div className="space-y-4">
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
                    value={newAdminData.email}
                    onChange={(e) =>
                      setNewAdminData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-airbnb-rausch focus:border-airbnb-rausch transition-airbnb bg-white disabled:opacity-50"
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="tempPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Temporary Password
                  </label>
                  <div className="flex space-x-2">
                    <input
                      id="tempPassword"
                      type="text"
                      value={newAdminData.tempPassword}
                      onChange={(e) =>
                        setNewAdminData((prev) => ({
                          ...prev,
                          tempPassword: e.target.value,
                        }))
                      }
                      required
                      disabled={loading}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-airbnb-rausch focus:border-airbnb-rausch transition-airbnb bg-white disabled:opacity-50"
                      placeholder="Temporary password"
                    />
                    <button
                      type="button"
                      onClick={generateTempPassword}
                      disabled={loading}
                      className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-airbnb disabled:opacity-50 whitespace-nowrap"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    The new admin will be forced to change this password on
                    first login
                  </p>
                </div>
              </div>
            ) : (
              /* Existing Admin Selection */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Existing User
                </label>
                <AutoComplete
                  options={existingUsers}
                  value={selectedUser}
                  onChange={setSelectedUser}
                  onSelect={(value) => setSelectedUser(value)}
                  placeholder="Search for existing user..."
                  displayKey="email"
                  valueKey="id"
                  disabled={loading}
                  renderOption={(user, isHighlighted) => (
                    <div
                      className={`flex items-center justify-between ${isHighlighted ? "text-airbnb-rausch" : "text-gray-900"}`}
                    >
                      <span>{user.email}</span>
                      <span className="text-xs text-gray-500 capitalize">
                        {user.role || "branch_admin"}
                      </span>
                    </div>
                  )}
                />
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    What happens next?
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        A new branch will be created starting from{" "}
                        {selectedMember.name}
                      </li>
                      <li>
                        All descendants of {selectedMember.name} will be
                        assigned to this branch
                      </li>
                      <li>
                        The assigned admin will only be able to manage members
                        in this branch
                      </li>
                      <li>
                        {adminType === "new"
                          ? "The new admin will receive login credentials and must change their password"
                          : "The existing user will gain access to this new branch"}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-airbnb disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  (adminType === "new" &&
                    (!newAdminData.email || !newAdminData.tempPassword)) ||
                  (adminType === "existing" && !selectedUser)
                }
                className="px-6 py-2 bg-airbnb-rausch text-white rounded-lg hover:bg-red-600 transition-airbnb disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
                    Creating Branch...
                  </div>
                ) : adminType === "new" ? (
                  "Create & Assign"
                ) : (
                  "Assign"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
