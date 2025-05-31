import { SubmitHandler, useForm } from "react-hook-form";
import { useContext, useState, useEffect } from "react";
import {
  changePassword,
  getUserDetails,
  updateUserDetails,
} from "../services/AuthServices";
import GlobalContext from "../context/GlobalContext";
import axios from "axios";
import {
  FaEdit,
  FaUser,
  FaLock,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";

type ChangePasswordFields = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type UserDetailsFields = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
};

const Profile = () => {
  const { auth, setAuth } = useContext(GlobalContext);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "password">("details");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showEditOptions, setShowEditOptions] = useState(false);

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    setError: setPasswordError,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPassword,
  } = useForm<ChangePasswordFields>();

  const {
    register: registerDetails,
    handleSubmit: handleDetailsSubmit,
    formState: { errors: detailsErrors, isSubmitting: isDetailsSubmitting },
    reset: resetDetails,
    setValue,
  } = useForm<UserDetailsFields>();

  // Auto-dismiss message after 2 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Reset password form when switching tabs
  useEffect(() => {
    if (activeTab === "password") {
      resetPassword();
    }
  }, [activeTab, resetPassword]);

  // Reset form and hide edit options when canceling
  const handleCancelEdit = () => {
    setIsEditing(false);
    setShowEditOptions(false);
    resetDetails();
    resetPassword();
  };

  // Set initial values from auth context
  useEffect(() => {
    if (auth) {
      setValue("email", auth.email);
      setValue("firstName", auth.firstName);
      setValue("lastName", auth.lastName);
    }
  }, [auth, setValue]);

  // Fetch user details when component mounts
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await getUserDetails(auth.accessToken);
        const userData = response.data;
        setAuth({
          ...auth,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          address: userData.address,
        });
      } catch (error) {
        console.error("Error fetching user details:", error);
        setMessage({
          type: "error",
          text: "Failed to fetch user details",
        });
      }
    };

    if (auth.accessToken) {
      fetchUserDetails();
    }
  }, [auth.accessToken]);

  const onPasswordSubmit: SubmitHandler<ChangePasswordFields> = async (
    data
  ) => {
    try {
      if (data.newPassword !== data.confirmPassword) {
        setPasswordError("confirmPassword", {
          message: "Passwords do not match",
        });
        return;
      }

      await changePassword(
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        auth.accessToken
      );

      setMessage({ type: "success", text: "Password changed successfully!" });
      resetPassword();
      setIsEditing(false);
      setShowEditOptions(false);
    } catch (error) {
      console.error("Error changing password:", error);
      if (axios.isAxiosError(error)) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Failed to change password",
        });
      }
    }
  };

  const onDetailsSubmit: SubmitHandler<UserDetailsFields> = async (data) => {
    try {
      await updateUserDetails(data, auth.accessToken);
      setAuth({
        ...auth,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        address: data.address,
      });
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
      setShowEditOptions(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (axios.isAxiosError(error)) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Failed to update profile",
        });
      }
    }
  };

  return (
    <div className="mt-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-4">
          {message && (
            <div
              className={`p-4 mb-6 rounded-md transition-opacity duration-300 ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setActiveTab("details");
                  setShowEditOptions(false);
                  setIsEditing(false);
                  resetDetails();
                  resetPassword();
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === "details"
                    ? "bg-green-700 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <FaUser />
                <span>Personal Details</span>
              </button>
            </div>
            {!isEditing && !showEditOptions && (
              <button
                onClick={() => setShowEditOptions(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
              >
                <FaEdit />
                Edit Profile
              </button>
            )}
            {showEditOptions && !isEditing && (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setActiveTab("details");
                  }}
                  className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
                >
                  Edit Personal Details
                </button>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setActiveTab("password");
                  }}
                  className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
                >
                  Change Password
                </button>
              </div>
            )}
          </div>

          {activeTab === "details" ? (
            <form onSubmit={handleDetailsSubmit(onDetailsSubmit)}>
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <FaUser className="w-6 h-6 text-green-700" />
                  </div>
                  <div className="flex-grow">
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      First Name
                    </label>
                    {isEditing ? (
                      <input
                        id="firstName"
                        {...registerDetails("firstName", {
                          required: "First name is required",
                        })}
                        type="text"
                        className="mt-1 block w-96 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none transition-colors"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">
                        {auth.firstName || "Not set"}
                      </p>
                    )}
                    {isEditing && detailsErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600">
                        {detailsErrors.firstName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <FaUser className="w-6 h-6 text-green-700" />
                  </div>
                  <div className="flex-grow">
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Last Name
                    </label>
                    {isEditing ? (
                      <input
                        id="lastName"
                        {...registerDetails("lastName", {
                          required: "Last name is required",
                        })}
                        type="text"
                        className="mt-1 block w-96 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none transition-colors"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">
                        {auth.lastName || "Not set"}
                      </p>
                    )}
                    {isEditing && detailsErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600">
                        {detailsErrors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <FaEnvelope className="w-6 h-6 text-green-700" />
                  </div>
                  <div className="flex-grow">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        id="email"
                        {...registerDetails("email", {
                          required: "Email is required",
                        })}
                        type="email"
                        className="mt-1 block w-96 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none transition-colors"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{auth.email}</p>
                    )}
                    {isEditing && detailsErrors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {detailsErrors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <FaMapMarkerAlt className="w-6 h-6 text-green-700" />
                  </div>
                  <div className="flex-grow">
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Address
                    </label>
                    {isEditing ? (
                      <input
                        id="address"
                        {...registerDetails("address", {
                          required: "Address is required",
                        })}
                        type="text"
                        className="mt-1 block w-96 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none transition-colors"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">
                        {auth.address || "Not set"}
                      </p>
                    )}
                    {isEditing && detailsErrors.address && (
                      <p className="mt-1 text-sm text-red-600">
                        {detailsErrors.address.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      handleCancelEdit();
                      setShowEditOptions(false);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDetailsSubmitting}
                    className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors disabled:opacity-50"
                  >
                    {isDetailsSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </form>
          ) : (
            <form
              onSubmit={handlePasswordSubmit(onPasswordSubmit)}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    {...registerPassword("currentPassword", {
                      required: "Current password is required",
                    })}
                    type="password"
                    className="mt-1 block w-96 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none transition-colors"
                  />
                  {isEditing && passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    {...registerPassword("newPassword", {
                      required: "New password is required",
                    })}
                    type="password"
                    className="mt-1 block w-96 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none transition-colors"
                  />
                  {isEditing && passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    {...registerPassword("confirmPassword", {
                      required: "Please confirm your new password",
                    })}
                    type="password"
                    className="mt-1 block w-96 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 focus:outline-none transition-colors"
                  />
                  {isEditing && passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      handleCancelEdit();
                      setShowEditOptions(false);
                      setActiveTab("details");
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPasswordSubmitting}
                    className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors disabled:opacity-50"
                  >
                    {isPasswordSubmitting
                      ? "Changing Password..."
                      : "Change Password"}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
