import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Profile from "../Profile";
import GlobalContext from "../../context/GlobalContext";

jest.mock("../../services/AuthServices", () => ({
  getUserDetails: jest.fn(() =>
    Promise.resolve({
      data: {
        firstName: "Rishanthan",
        lastName: "Sritharan",
        email: "e20338@eng.pdn.ac.lk",
        address: "No 2, LLG Division, Poonagala",
      },
    })
  ),
  updateUserDetails: jest.fn(() => Promise.resolve({})),
  changePassword: jest.fn(() => Promise.resolve({})),
}));

// Mock the auth context
const mockAuth = {
  accessToken: "mock-token",
  firstName: "Rishanthan",
  lastName: "Sritharan",
  email: "e20338@eng.pdn.ac.lk",
  address: "No 2, LLG Division, Poonagala",
  password: "mock-password",
};

const mockSetAuth = jest.fn();

const renderProfile = () => {
  return render(
    <GlobalContext.Provider
      value={{
        auth: mockAuth,
        setAuth: mockSetAuth,
        showCattleAddForm: false,
        setShowCattleAddForm: () => {},
        showCattleCard: false,
        setShowCattleCard: () => {},
      }}
    >
      <Profile />
    </GlobalContext.Provider>
  );
};

describe("Profile Component", () => {
  it("renders user details correctly", () => {
    renderProfile();

    expect(screen.getByText("Rishanthan")).toBeInTheDocument();
    expect(screen.getByText("Sritharan")).toBeInTheDocument();
    expect(screen.getByText("e20338@eng.pdn.ac.lk")).toBeInTheDocument();
    expect(
      screen.getByText("No 2, LLG Division, Poonagala")
    ).toBeInTheDocument();
  });

  it("allows editing personal details", async () => {
    renderProfile();

    // Click edit button
    const editButton = screen.getByText("Edit Profile");
    await act(async () => {
      await userEvent.click(editButton);
    });

    // Click edit personal details
    const editDetailsButton = screen.getByText("Edit Personal Details");
    await act(async () => {
      await userEvent.click(editDetailsButton);
    });

    // Fill in the form
    const firstNameInput = screen.getByLabelText("First Name");
    const lastNameInput = screen.getByLabelText("Last Name");
    const emailInput = screen.getByLabelText("Email");
    const addressInput = screen.getByLabelText("Address");

    await act(async () => {
      await userEvent.clear(firstNameInput);
      await userEvent.type(firstNameInput, "Jane");
      await userEvent.clear(lastNameInput);
      await userEvent.type(lastNameInput, "Smith");
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, "jane@example.com");
      await userEvent.clear(addressInput);
      await userEvent.type(addressInput, "456 New St");
    });

    // Submit the form
    const saveButton = screen.getByText("Save Changes");
    await act(async () => {
      await userEvent.click(saveButton);
    });

    // Wait for success message
    await waitFor(() => {
      expect(
        screen.getByText("Profile updated successfully!")
      ).toBeInTheDocument();
    });
  });

  it("allows changing password", async () => {
    renderProfile();

    // Click edit button
    const editButton = screen.getByText("Edit Profile");
    await act(async () => {
      await userEvent.click(editButton);
    });

    // Click change password
    const changePasswordButton = screen.getByText("Change Password");
    await act(async () => {
      await userEvent.click(changePasswordButton);
    });

    // Fill in the form
    const currentPasswordInput = screen.getByLabelText("Current Password");
    const newPasswordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password");

    await act(async () => {
      await userEvent.type(currentPasswordInput, "oldpass123");
      await userEvent.type(newPasswordInput, "newpass123");
      await userEvent.type(confirmPasswordInput, "newpass123");
    });

    // Submit the form
    const changeButton = screen.getByText("Change Password");
    await act(async () => {
      await userEvent.click(changeButton);
    });

    // Wait for success message
    await waitFor(() => {
      expect(
        screen.getByText("Password changed successfully!")
      ).toBeInTheDocument();
    });
  });
});
