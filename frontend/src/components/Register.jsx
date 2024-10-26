import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

const Register = () => {
	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
	} = useForm();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [participationType, setParticipationType] = useState("");

	const onSubmit = async (data) => {
		setLoading(true);
		try {
			const payload = {
				username: data.username.trim(),
				email: data.email.trim().toLowerCase(),
				password: data.password,
				participationType: data.participationType,
			};

			// Add team data if registering as team
			if (data.participationType === "team") {
				payload.teamName = data.teamName.trim();
				payload.teamMembers = [];

				// Add only valid team members (both name and email must be present)
				for (let i = 1; i <= 4; i++) {
					const memberName = data[`memberName${i}`]?.trim();
					const memberEmail = data[`memberEmail${i}`]?.trim().toLowerCase();

					if (memberName && memberEmail) {
						// Validate email format
						const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
						if (!emailRegex.test(memberEmail)) {
							throw new Error(`Invalid email format for member ${i}`);
						}

						payload.teamMembers.push({
							name: memberName,
							email: memberEmail,
						});
					}
				}
			}

			console.log("Registration payload:", payload); // Debug log
			const response = await api.post("/users/register", payload);

			// Check response structure
			if (response.data && response.data.token) {
				localStorage.setItem("token", response.data.token);
			}

			navigate("/login", {
				state: { message: "Registration successful! Please login." },
			});
		} catch (err) {
			console.error("Registration error:", err.response?.data || err);
			const errorMessage =
				err.response?.data?.error ||
				err.message ||
				"Registration failed. Please try again.";

			setError("root", {
				type: "manual",
				message: errorMessage,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen w-full flex flex-col justify-center items-center text-gray-200">
			<div className="p-6 w-2/3 bg-gray-800 flex flex-col gap-6 justify-center items-center rounded-3xl shadow-xl m-10">
				<div className="border-b p-4">
					<h2 className="text-3xl font-bold text-center">Register</h2>
				</div>
				<div className="p-6 w-full">
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
						{/* Participation Type */}
						<div className="w-full">
							<label className="block text-sm font-medium">
								Registration Type
							</label>
							<select
								{...register("participationType", { required: true })}
								onChange={(e) => setParticipationType(e.target.value)}
								className="w-full p-2 rounded bg-gray-700 text-white"
							>
								<option value="">Select type</option>
								<option value="individual">Individual</option>
								<option value="team">Team</option>
							</select>
						</div>

						{/* Common Fields */}
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium">Username</label>
								<input
									type="text"
									{...register("username", {
										required: "Username is required",
										minLength: {
											value: 3,
											message: "Username must be at least 3 characters",
										},
									})}
									className="w-full p-2 rounded bg-gray-700 text-white"
								/>
								{errors.username && (
									<p className="mt-1 text-sm text-red-600">
										{errors.username.message}
									</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium">Email</label>
								<input
									type="email"
									{...register("email", {
										required: "Email is required",
										pattern: {
											value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
											message: "Invalid email address",
										},
									})}
									className="w-full p-2 rounded bg-gray-700 text-white"
								/>
								{errors.email && (
									<p className="mt-1 text-sm text-red-600">
										{errors.email.message}
									</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium">Password</label>
								<input
									type="password"
									{...register("password", {
										required: "Password is required",
										minLength: {
											value: 6,
											message: "Password must be at least 6 characters",
										},
									})}
									className="w-full p-2 rounded bg-gray-700 text-white"
								/>
								{errors.password && (
									<p className="mt-1 text-sm text-red-600">
										{errors.password.message}
									</p>
								)}
							</div>
						</div>

						{/* Team-specific Fields */}
						{participationType === "team" && (
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium">Team Name</label>
									<input
										type="text"
										{...register("teamName", {
											required: "Team name is required",
										})}
										className="w-full p-2 rounded bg-gray-700 text-white"
									/>
									{errors.teamName && (
										<p className="mt-1 text-sm text-red-600">
											{errors.teamName.message}
										</p>
									)}
								</div>

								{/* Team Members */}
								<div className="space-y-4">
									<h3 className="text-lg font-medium">
										Team Members (Optional)
									</h3>
									{[1, 2, 3, 4].map((index) => (
										<div key={index} className="grid grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium">
													Member {index} Name
												</label>
												<input
													type="text"
													{...register(`memberName${index}`)}
													className="w-full p-2 rounded bg-gray-700 text-white"
													placeholder="Member Name"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium">
													Member {index} Email
												</label>
												<input
													type="email"
													{...register(`memberEmail${index}`)}
													className="w-full p-2 rounded bg-gray-700 text-white"
													placeholder="Optional"
												/>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{errors.root && (
							<p className="text-sm text-red-600">{errors.root.message}</p>
						)}

						<div>
							<button
								type="submit"
								disabled={loading}
								className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
							>
								{loading ? "Registering..." : "Register"}
							</button>
						</div>

						<p className="mt-4 text-sm text-center">
							Don't have an account?{" "}
							<Link to="/login" className="text-blue-400 hover:underline">
								Login Here
							</Link>
						</p>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Register;
