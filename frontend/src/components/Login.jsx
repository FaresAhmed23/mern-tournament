import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
	const {
		register,
		handleSubmit,
		formState: { errors },
		setError: setFormError,
	} = useForm();
	const { login, loading } = useAuth();
	const navigate = useNavigate();

	const onSubmit = async (data) => {
		try {
			await login(data.email, data.password);
			navigate("/dashboard");
		} catch (err) {
			setFormError("root", {
				type: "manual",
				message: err.response?.data?.error || "Invalid email or password",
			});
		}
	};

	return (
		<div className="min-h-screen w-full flex flex-col gap-6 justify-center items-center text-gray-200">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="p-8 w-2/3 bg-gray-800 flex flex-col gap-6 justify-center items-center rounded-3xl shadow-xl"
			>
				<div className="border-b p-4">
					<h2 className="text-3xl font-bold text-center">Login</h2>
				</div>

				<div className="w-full">
					<label className='text-sm font-medium'>Email</label>
					<input
						type="email"
						{...register("email", {
							required: "Email is required",
							pattern: {
								value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
								message: "Invalid email address",
							},
						})}
						placeholder="Email"
						className="w-full p-2 rounded bg-gray-700 text-white"
					/>
					{errors.email && (
						<span className="text-red-500 text-sm">{errors.email.message}</span>
					)}
				</div>

				<div className="w-full">
					<label className='text-sm font-medium'>Password</label>
					<input
						type="password"
						{...register("password", {
							required: "Password is required",
							minLength: {
								value: 6,
								message: "Password must be at least 6 characters",
							},
						})}
						placeholder="Password"
						className="w-full p-2 rounded bg-gray-700 text-white"
					/>
					{errors.password && (
						<span className="text-red-500 text-sm">
							{errors.password.message}
						</span>
					)}
				</div>

				{errors.root && (
					<div className="text-red-500">{errors.root.message}</div>
				)}

				<button
					type="submit"
					disabled={loading}
					className="bg-blue-500 w-1/3 text-white md:px-4 px-2 py-2 rounded hover:bg-blue-600 transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "Logging in..." : "Login"}
				</button>

				<p className="mt-4 text-sm">
					Don't have an account?{" "}
					<Link to="/register" className="text-blue-400 hover:underline">
						Register here
					</Link>
				</p>
			</form>
		</div>
	);
};

export default Login;
