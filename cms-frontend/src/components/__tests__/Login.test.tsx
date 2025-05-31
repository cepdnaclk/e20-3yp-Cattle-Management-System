import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../Login";
import GlobalContext from "../../context/GlobalContext";
import { MemoryRouter } from "react-router-dom";
import { login } from "../../services/AuthServices";

// Mock the auth services
jest.mock("../../services/AuthServices", () => ({
  login: jest.fn(() =>
    Promise.resolve({
      data: {
        accessToken: "mock-token",
        firstName: "Rishanthan",
        lastName: "Sritharan",
        email: "e20338@eng.pdn.ac.lk",
        address: "No 2, LLG Division, Poonagala",
      },
    })
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

const renderLogin = () => {
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
        <Login />
      </GlobalContext.Provider>
    </MemoryRouter>
  );
};

describe("Login Component", () => {
  it("allows user to log in", async () => {
    renderLogin();

    // Fill in the form
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    await act(async () => {
      await userEvent.type(emailInput, "e20338@eng.pdn.ac.lk");
      await userEvent.type(passwordInput, "mock-password");
    });

    // Submit the form
    const loginButton = screen.getByText("Log in");
    await act(async () => {
      await userEvent.click(loginButton);
    });

    // Wait for API call
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "e20338@eng.pdn.ac.lk",
        password: "mock-password",
      });
    });
  });
});
