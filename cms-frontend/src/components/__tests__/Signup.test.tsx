import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Signup from "../Signup";
import GlobalContext from "../../context/GlobalContext";
import { MemoryRouter } from "react-router-dom";
import { signup } from "../../services/AuthServices";

// Mock the auth services
jest.mock("../../services/AuthServices", () => ({
  signup: jest.fn(() =>
    Promise.resolve({ data: { message: "Signup successful!" } })
  ),
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

const renderSignup = () => {
  return render(
    <MemoryRouter>
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
        <Signup />
      </GlobalContext.Provider>
    </MemoryRouter>
  );
};

describe("Signup Component", () => {
  it("allows user to sign up", async () => {
    renderSignup();

    // Fill in the form
    const firstNameInput = screen.getByLabelText("First name");
    const lastNameInput = screen.getByLabelText("Last name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const addressInput = screen.getByLabelText("Address");

    await act(async () => {
      await userEvent.type(firstNameInput, "Rishanthan");
      await userEvent.type(lastNameInput, "Sritharan");
      await userEvent.type(emailInput, "e20338@eng.pdn.ac.lk");
      await userEvent.type(passwordInput, "password123");
      await userEvent.type(addressInput, "No 2, LLG Division, Poonagala");
    });

    // Submit the form
    const signupButton = screen.getByText("Sign up");
    await act(async () => {
      await userEvent.click(signupButton);
    });

    // Wait for success message
    await waitFor(() => {
      expect(signup).toHaveBeenCalledWith({
        firstName: "Rishanthan",
        lastName: "Sritharan",
        email: "e20338@eng.pdn.ac.lk",
        password: "password123",
        address: "No 2, LLG Division, Poonagala",
      });
    });
  });
});
