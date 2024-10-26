import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import api from "../services/api";
import { Loader2 } from "lucide-react"; // Using lucide-react for a better loading spinner

export default function Leaderboard() {
	const [participants, setParticipants] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchLeaderboard = async () => {
			try {
				const [teamsResponse, usersResponse] = await Promise.all([
					api.get("/teams/leaderboard"),
					api.get("/users/leaderboard"),
				]);

				const teamsData = teamsResponse.data.map((team) => ({
					...team,
					participantType: "team",
					displayName: team.name,
					memberCount: team.members?.length || 0,
				}));

				const usersData = usersResponse.data.map((user) => ({
					...user,
					participantType: "individual",
					displayName: user.username,
					memberCount: 1,
				}));

				const combinedData = [...teamsData, ...usersData]
					.sort((a, b) => (b.score || 0) - (a.score || 0))
					.map((participant, index) => ({
						...participant,
						rank: index + 1,
					}));

				setParticipants(combinedData);
				setError(null);
			} catch (error) {
				console.error("Error fetching leaderboard:", error);
				setError(
					"Oops! We couldn't load the leaderboard right now. Please try again later.",
				);
			} finally {
				setLoading(false);
			}
		};

		fetchLeaderboard();
	}, []);

	const getParticipantTypeColor = (type) => {
		return type === "team"
			? "bg-blue-100 text-blue-800"
			: "bg-green-100 text-green-800";
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<div className="flex flex-col items-center gap-2">
					<Loader2 className="w-12 h-12 animate-spin text-blue-600" />
					<span className="text-gray-600">Loading leaderboard...</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div>
				<Navbar />
				<div className="flex items-center justify-center h-64">
					<div className="text-xl text-red-600">{error}</div>
				</div>
			</div>
		);
	}

	return (
		<div>
			<Navbar />
			<div className="container mx-auto px-4 py-8">
				{/* Leaderboard Guide Section - More friendly and engaging text */}
				<div className="bg-gray-100 p-6 rounded-lg mb-8">
					<h2 className="text-xl font-semibold text-gray-700 mb-4">
						👋 Welcome to Your Tournament Hub!
					</h2>
					<p className="text-gray-600 mb-4">
						Ready to see how you stack up against the competition? Our
						leaderboard shows you exactly where everyone stands - whether you're
						competing solo or as part of a team!
					</p>
					<div className="space-y-4">
						<h3 className="font-medium text-gray-700">
							Here's what you'll see:
						</h3>
						<div className="grid md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<p className="flex items-center gap-2">
									<span className="text-blue-600">🏆</span>
									<span>
										<strong>Rank:</strong> Your current position on the
										leaderboard
									</span>
								</p>
								<p className="flex items-center gap-2">
									<span className="text-blue-600">👤</span>
									<span>
										<strong>Name:</strong> Your player or team name
									</span>
								</p>
								<p className="flex items-center gap-2">
									<span className="text-blue-600">🎯</span>
									<span>
										<strong>Type:</strong> Shows if you're playing solo or with
										a team
									</span>
								</p>
								<p className="flex items-center gap-2">
									<span className="text-blue-600">📧</span>
									<span>
										<strong>Contact:</strong> Team captain or player email
									</span>
								</p>
							</div>
							<div className="space-y-2">
								<p className="flex items-center gap-2">
									<span className="text-blue-600">👥</span>
									<span>
										<strong>Members:</strong> Size of your team (or just you!)
									</span>
								</p>
								<p className="flex items-center gap-2">
									<span className="text-blue-600">💯</span>
									<span>
										<strong>Score:</strong> Your current tournament points
									</span>
								</p>
								<p className="flex items-center gap-2">
									<span className="text-blue-600">🌟</span>
									<span>
										<strong>Wins:</strong> Number of victories so far
									</span>
								</p>
							</div>
						</div>
						<p className="text-sm text-gray-600 mt-4">
							Pro tip: The leaderboard updates automatically as scores come in.
							Keep an eye on your position and chase that top spot! 🚀
						</p>
					</div>
				</div>

				{/* Leaderboard Table Section */}
				<div className="bg-white rounded-lg shadow-lg">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-2xl font-bold text-gray-800">
							Tournament Standings
						</h2>
					</div>
					<div className="p-6">
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Rank
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Name
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Type
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Captain/Email
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Members
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Score
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Wins
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{participants.map((participant) => (
										<tr
											key={participant._id}
											className="hover:bg-gray-50 transition-colors duration-150"
										>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{participant.rank}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm font-medium text-gray-900">
													{participant.displayName}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getParticipantTypeColor(
														participant.participantType,
													)}`}
												>
													{participant.participantType === "team"
														? "Team"
														: "Individual"}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-900">
													{participant.participantType === "team"
														? participant.captain?.username || "N/A"
														: participant.email}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-900">
													{participant.memberCount}{" "}
													{participant.memberCount === 1 ? "member" : "members"}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm font-medium text-gray-900">
													{participant.score || 0}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm font-medium text-gray-900">
													{participant.wins || 0}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
