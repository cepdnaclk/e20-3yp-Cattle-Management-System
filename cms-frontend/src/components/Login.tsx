import { set, SubmitHandler, useForm } from "react-hook-form";
import CattleGrazing from "../assets/images/CattleLogin3.jpg";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { login } from "../services/AuthServices";
import axios from "axios";
import GlobalContext from "../context/GlobalContext";
import { useContext } from "react";

type FormFields = {
  email: string;
  password: string;
};

const Login = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>();
  const { setAuth } = useContext(GlobalContext);

  // Clear auth state from localStorage and context
  const handleLogout = () => {
    localStorage.removeItem("auth");
    setAuth({
      email: "",
      password: "",
      accessToken: "",
      firstName: "",
      lastName: "",
      address: "",
    });
  };

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    try {
      const response = await login(data);
      const accessToken = response.data.accessToken;
      console.log(accessToken);
      setAuth({
        email: data.email,
        password: data.password,
        accessToken: response.data.accessToken,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        address: response.data.address,
      });
      console.log("Login successful", response.data.accessToken);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error during signup:", error);
      if (axios.isAxiosError(error)) {
        console.log("Axios error:", error.response?.data);
        if (error.response?.data?.errors.email) {
          setError("email", {
            message: error.response?.data?.errors.email,
          });
        } else if (error.response?.data?.errors.password) {
          setError("password", {
            message: error.response?.data?.errors.password,
          });
        } else {
          setError("root", {
            message:
              error.response?.data.message || "An unknown error occurred.",
          });
        }
      } else {
        setError("root", {
          message: "An unknown error occurred.",
        });
      }
    }
  };

  return (
    <div className="flex w-full h-screen">
      {/* login form */}
      <div className="flex items-center justify-center bg-lime-100 w-full lg:w-1/2">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white w-xl px-10 py-12 rounded-3xl border-2 border-gray-100"
        >
          <h1 className="text-5xl font-semibold">Log in to CMS now</h1>
          <p className="font-medium text-lg text-gray-500 mt-4">
            Welcome back! Please enter your details
          </p>
          <div className="mt-8">
            <div>
              <label htmlFor="email" className="text-lg font-medium">
                Email
              </label>
              <input
                id="email"
                className="w-full border-2 border-gray-100 bg-transparent rounded-lg p-3 mt-1"
                placeholder="Enter your email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 ml-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="mt-3">
              <label htmlFor="password" className="text-lg font-medium">
                Password
              </label>
              <input
                id="password"
                className="w-full border-2 border-gray-100 bg-transparent rounded-lg p-3 mt-1"
                placeholder="Enter your password"
                type="password"
                {...register("password", {
                  required: "Password is required",
                })}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>
            <button className="mt-2 ml-1 font-medium text-base text-violet-400">
              Forgot Pasword
            </button>
            <div className="mt-5 flex flex-col">
              <button className="hover:scale-[1.01] ease-in-out transition-all py-3 rounded-xl bg-violet-500 text-white text-lg font-bold">
                {isSubmitting ? "Logging in..." : "Log in"}
              </button>
              {errors.root && (
                <p className="text-red-500 text-md mt-1.5 ml-1">
                  {errors.root.message}{" "}
                </p>
              )}
            </div>
            <div className="flex flex-row mt-3 ml-1 items-center space-x-4">
              <p className="text-md text-gray-500">
                Don't you have an account?
              </p>
              <button
                onClick={() => navigate("/signup")}
                className="text-md text-violet-400 hover:text-violet-700 hover:scale-[1.02]"
              >
                Sign up here
              </button>
              <Link to="/signup"></Link>
            </div>
            {/* <div className="mt-5">
              <Divider>Or</Divider>
            </div> */}
          </div>
        </form>
      </div>

      {/* Display the image */}
      <div className="hidden lg:flex w-1/2 items-center justify-start">
        <img src={CattleGrazing} className="w-full h-full object-cover" />
      </div>
    </div>
  );
};

export default Login;
