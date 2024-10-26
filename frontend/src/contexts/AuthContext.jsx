import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const checkAuthStatus = async () => {
		const token = localStorage.getItem("token");
		if (token) {
			try {
				api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
				const response = await api.get("/users");

				const userData = {
					id: response.data.id,
					username: response.data.username,
					email: response.data.email,
					role: response.data.role,
					teamId: response.data.teamId || null,
					isCaptain: response.data.isCaptain || false,
					isAuthenticated: true,
				};

				setUser(userData);

				if (userData.teamId) {
					try {
						const teamResponse = await api.get(`/teams/${userData.teamId}`);
					} catch (teamErr) {
						console.error("Failed to fetch team info:", teamErr);
					}
				}
			} catch (err) {
				console.error("Failed to verify token:", err);
				localStorage.removeItem("token");
				delete api.defaults.headers.common["Authorization"];
				setUser(null);
			}
		} else {
			setUser(null);
		}
		setLoading(false);
	};

	useEffect(() => {
		checkAuthStatus();
	}, []);

	const login = async (email, password) => {
		try {
			setLoading(true);
			setError(null);
			const response = await api.post("/users/login", { email, password });
			const { token, user: userData } = response.data;
			localStorage.setItem("token", token);
			api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
			setUser({
				id: userData.id,
				username: userData.username,
				email: userData.email,
				role: userData.role,
				teamId: userData.teamId,
				isCaptain: userData.isCaptain,
				isAuthenticated: true,
			});
		} catch (err) {
			setError(err.response?.data?.error || "Invalid email or password");
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const logout = () => {
		localStorage.removeItem("token");
		delete api.defaults.headers.common["Authorization"];
		setUser(null);
	};

	const getTeamInfo = async () => {
		if (user?.teamId) {
			try {
				const response = await api.get(`/teams/${user.teamId}`);
				return response.data;
			} catch (err) {
				console.error("Failed to fetch team info:", err);
				return null;
			}
		}
		return null;
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				login,
				logout,
				loading,
				error,
				checkAuthStatus,
				getTeamInfo,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
