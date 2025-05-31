import { SubmitHandler, useForm } from "react-hook-form";
import CattleGrazing from "../assets/images/CattleLogin3.jpg";
import { useNavigate } from "react-router-dom";
import { signup } from "../services/AuthServices";
import axios from "axios";

type FormFields = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  address: string;
};

const Signup = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>();

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    try {
      await signup(data);
      console.log(data);
      navigate("/login");
    } catch (error) {
      console.error("Error during signup:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.errors.email) {
          setError("email", {
            message: error.response?.data?.errors.email,
          });
        } else {
          setError("root", {
            message: error.message,
          });
        }
      }
    }
  };

  return (
    <div className="flex w-full h-screen">
      {/* Signup form */}
      <div className="flex items-center justify-center bg-lime-100 w-full lg:w-1/2">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white w-xl px-10 py-12 rounded-3xl border-2 border-gray-100"
        >
          <h1 className="text-5xl font-semibold">Sign up to CMS now</h1>
          <div className="mt-8">
            <div className="mt-3">
              <label htmlFor="firstName" className="text-lg font-medium">
                First name
              </label>
              <input
                id="firstName"
                className="w-full border-2 border-gray-100 bg-transparent rounded-lg p-3 mt-1"
                placeholder="Enter your first name"
                {...register("firstName", {
                  required: "First name is required",
                  minLength: {
                    value: 2,
                    message: "First name must be at least 2 characters",
                  },
                })}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1 ml-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="mt-3">
              <label htmlFor="lastName" className="text-lg font-medium">
                Last name
              </label>
              <input
                id="lastName"
                className="w-full border-2 border-gray-100 bg-transparent rounded-lg p-3 mt-1"
                placeholder="Enter your last name"
                {...register("lastName", {
                  required: "Last name is required",
                  minLength: {
                    value: 2,
                    message: "Last name must be at least 2 characters",
                  },
                })}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1 ml-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
            <div className="mt-3">
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
              <label htmlFor="address" className="text-lg font-medium">
                Address
              </label>
              <input
                id="address"
                className="w-full border-2 border-gray-100 bg-transparent rounded-lg p-3 mt-1"
                placeholder="Enter your address"
                {...register("address", {
                  required: "Address is required",
                })}
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1 ml-1">
                  {errors.address.message}
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
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="mt-5 flex flex-col">
              <button className="hover:scale-[1.01] ease-in-out transition-all py-3 rounded-xl bg-violet-500 text-white text-lg font-bold">
                {isSubmitting ? "Signing up..." : "Sign up"}
              </button>
              {errors.root && (
                <p className="text-red-500 text-md mt-1.5 ml-1">
                  {errors.root.message}{" "}
                </p>
              )}
            </div>
            <div className="flex flex-row mt-3 ml-1 items-center space-x-4">
              <p className="text-md text-gray-500">Already have an account?</p>
              <button
                onClick={() => navigate("/login")}
                className="text-md text-violet-400 hover:text-violet-700 hover:scale-[1.02]"
              >
                Log in here
              </button>
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

export default Signup;
