import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

const UserProfileDropdown = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [stats, setStats] = useState({
		score: 0,
		wins: 0,
	});
	const [userDetails, setUserDetails] = useState(null);

	useEffect(() => {
		const fetchUserDetails = async () => {
			try {
				const response = await api.get("/users/profile");
				if (response.data) {
					setUserDetails(response.data);
				}
			} catch (error) {
				console.error("Error fetching user details:", error);
			}
		};

		if (user?.id) {
			fetchUserDetails();
		}
	}, [user?.id]);

	useEffect(() => {
		const fetchUserStats = async () => {
			try {
				const endpoint =
					userDetails?.participationType === "team"
						? "/teams/leaderboard"
						: "/users/leaderboard";

				const response = await api.get(endpoint);

				if (response.data) {
					const participantData = response.data.find((p) =>
						userDetails?.participationType === "team"
							? p.captain?._id === user?.id
							: p._id === user?.id,
					);

					if (participantData) {
						setStats({
							score: participantData.score || 0,
							wins: participantData.wins || 0,
						});
					}
				}
			} catch (error) {
				console.error("Error fetching stats:", error);
			}
		};

		if (userDetails) {
			fetchUserStats();
		}
	}, [userDetails]);

	const handleLogout = async () => {
		await logout();
		navigate("/login");
	};

	const getBadgeColor = (role) => {
		switch (role) {
			case "Administrator":
				return "bg-purple-100 text-purple-800";
			case "Moderator":
				return "bg-green-100 text-green-800";
			default:
				return "bg-blue-100 text-blue-800";
		}
	};

	const getPositionBadgeColor = (position) => {
		switch (position) {
			case "Team Captain":
				return "bg-yellow-100 text-yellow-800";
			case "Team Member":
				return "bg-green-100 text-green-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center space-x-2 text-white hover:text-gray-300 focus:outline-none transition-all duration-150"
			>
				<div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
					{user?.username?.charAt(0).toUpperCase()}
				</div>
				<span className="hidden md:flex">{user?.username}</span>
			</button>

			{isOpen && userDetails && (
				<div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl py-1 z-50">
					{/* Profile Header */}
					<div className="px-4 py-3 border-b">
						<div className="flex items-center space-x-3">
							<div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-semibold">
								{user?.username?.charAt(0).toUpperCase()}
							</div>
							<div className="flex-1">
								<p className="text-sm font-semibold text-gray-900">
									{user?.username}
								</p>
								<p className="text-sm text-gray-500">{user?.email}</p>
								<span
									className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getBadgeColor(
										userDetails.formattedRole,
									)}`}
								>
									{userDetails.formattedRole}
								</span>
							</div>
						</div>
					</div>

					{/* Tournament Stats */}
					<div className="px-4 py-2 border-b">
						<p className="text-xs font-medium text-gray-500 uppercase mb-2">
							Tournament Stats
						</p>
						<div className="grid grid-cols-2 gap-2">
							<div className="bg-blue-50 p-2 rounded">
								<p className="text-xs text-gray-500">Score</p>
								<p className="text-lg font-semibold text-blue-600 transition-all duration-150 hover:scale-110">
									{stats.score?.toLocaleString() || "0"}
								</p>
							</div>
							<div className="bg-yellow-50 p-2 rounded">
								<p className="text-xs text-gray-500">Wins</p>
								<p className="text-lg font-semibold text-yellow-600 transition-all duration-150 hover:scale-110">
									{stats.wins?.toLocaleString() || "0"}
								</p>
							</div>
						</div>
					</div>

					{/* User Info */}
					<div className="px-4 py-2 border-b">
						<p className="text-xs font-medium text-gray-500 uppercase mb-2">
							Account Info
						</p>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-500">Type</span>
								<span className="text-sm font-medium px-2 py-1 bg-gray-100 rounded transition-all duration-150 hover:scale-110">
									{userDetails.formattedParticipationType}
								</span>
							</div>

							{userDetails.formattedPosition && (
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-500">Position</span>
									<span
										className={`text-sm font-medium px-2 py-1 rounded ${getPositionBadgeColor(
											userDetails.formattedPosition,
										)}`}
									>
										{userDetails.formattedPosition}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Actions */}
					<div className="px-4 py-2">
						<button
							onClick={handleLogout}
							className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-100 rounded transition-all duration-150"
						>
							Logout
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

const Navbar = () => {
	const [isNavOpen, setIsNavOpen] = useState(false);

	return (
		<nav className="bg-gray-800 p-5 md:rounded-b-full rounded-b-3xl">
			<div className="container mx-auto flex justify-between items-center">
				<Link
					to="/dashboard"
					className="md:text-4xl text-2xl text-gray-300 font-semibold tracking-wide kablammo-ff"
				>
					DEVOUR
				</Link>
				<div className="flex md:space-x-6 justify-center items-center space-x-2">
					<section className="MOBILE-MENU flex md:hidden">
						<div
							className="space-y-2"
							onClick={() => setIsNavOpen((prev) => !prev)}
						>
							<span className="block h-0.5 w-8 animate-pulse bg-gray-600"></span>
							<span className="block h-0.5 w-8 animate-pulse bg-gray-600"></span>
							<span className="block h-0.5 w-8 animate-pulse bg-gray-600"></span>
						</div>

						<div
							className={`min-h-screen ${
								isNavOpen ? "showMenuNav" : "hideMenuNav"
							}`}
						>
							<div
								className="absolute top-0 right-0 px-8 py-8"
								onClick={() => setIsNavOpen(false)}
							>
								<svg
									className="h-8 w-8 text-gray-600"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</div>
							<ul className="flex flex-col items-center justify-between min-h-[250px]">
								<Link
									to="/dashboard"
									className="text-black text-3xl transition-all duration-150"
								>
									Home
								</Link>
								<Link
									to="/events"
									className="text-black text-3xl transition-all duration-150"
								>
									Events
								</Link>
								<Link
									to="/leaderboard"
									className="text-black text-3xl transition-all duration-150"
								>
									Leaderboard
								</Link>
							</ul>
						</div>
					</section>

					<ul className="DESKTOP-MENU hidden space-x-8 md:flex">
						<Link
							to="/dashboard"
							className="text-white hover:text-gray-300 transition-all duration-150"
						>
							Home
						</Link>
						<Link
							to="/events"
							className="text-white hover:text-gray-300 transition-all duration-150"
						>
							Events
						</Link>
						<Link
							to="/leaderboard"
							className="text-white hover:text-gray-300 transition-all duration-150"
						>
							Leaderboard
						</Link>
					</ul>
				</div>
					<UserProfileDropdown />
			</div>
		</nav>
	);
};

export default Navbar;
