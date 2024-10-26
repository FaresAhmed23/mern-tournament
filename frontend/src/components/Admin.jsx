import React, { useState, useEffect } from "react";
import api from "../services/api";

const Admin = () => {
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(false);
	const [newEvent, setNewEvent] = useState({
		name: "",
		type: "online",
		description: "",
		location: "",
		startDate: "",
		endDate: "",
		questions: [],
		maxParticipants: 0,
	});
	const [currentQuestion, setCurrentQuestion] = useState({
		question: "",
		answer: "",
		options: ["", "", "", ""],
	});
	const [error, setError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [editingEvent, setEditingEvent] = useState(null);
	const [filterType, setFilterType] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		fetchEvents();
	}, [filterType]);

	const fetchEvents = async () => {
		try {
			setLoading(true);
			const response = await api.get("/events", {
				params: {
					type: filterType !== "all" ? filterType : undefined,
					search: searchQuery || undefined,
				},
			});
			setEvents(response.data);
		} catch (error) {
			setError(
				"Failed to fetch events: " +
					(error.response?.data?.error || error.message),
			);
		} finally {
			setLoading(false);
		}
	};

	const handleAddQuestion = () => {
		if (!validateQuestion()) return;

		const validOptions = currentQuestion.options
			.map((opt) => opt.trim())
			.filter((opt) => opt !== "");

		setNewEvent((prev) => ({
			...prev,
			questions: [
				...prev.questions,
				{
					...currentQuestion,
					options: validOptions,
					points: 10,
				},
			],
		}));

		resetQuestionForm();
	};

	const validateQuestion = () => {
		if (!currentQuestion.question.trim()) {
			setError("Question text is required");
			return false;
		}

		if (!currentQuestion.answer.trim()) {
			setError("Answer is required");
			return false;
		}

		const validOptions = currentQuestion.options.filter(
			(opt) => opt.trim() !== "",
		);
		if (validOptions.length < 2) {
			setError("At least two options are required");
			return false;
		}

		if (!validOptions.includes(currentQuestion.answer.trim())) {
			setError("The answer must be one of the provided options");
			return false;
		}

		return true;
	};

	const resetQuestionForm = () => {
		setCurrentQuestion({
			question: "",
			answer: "",
			options: ["", "", "", ""],
		});
		setError("");
	};

	const handleOptionChange = (index, value) => {
		setCurrentQuestion((prev) => ({
			...prev,
			options: prev.options.map((opt, i) => (i === index ? value : opt)),
		}));
	};

	const validateEvent = () => {
		if (!newEvent.name.trim() || !newEvent.description.trim()) {
			setError("Name and description are required");
			return false;
		}

		const start = new Date(newEvent.startDate);
		const end = new Date(newEvent.endDate);
		const now = new Date();

		if (isNaN(start.getTime()) || isNaN(end.getTime())) {
			setError("Invalid date format");
			return false;
		}

		if (start >= end) {
			setError("End date must be after start date");
			return false;
		}

		if (start < now) {
			setError("Start date cannot be in the past");
			return false;
		}

		if (newEvent.type === "online" && newEvent.questions.length === 0) {
			setError("Online events require at least one question");
			return false;
		}

		if (newEvent.type === "offline") {
			if (!newEvent.location?.trim()) {
				setError("Location is required for offline events");
				return false;
			}
			if (!newEvent.maxParticipants || newEvent.maxParticipants <= 0) {
				setError("Maximum participants must be greater than 0");
				return false;
			}
		}

		return true;
	};

	const handleCreateEvent = async (e) => {
		e.preventDefault();
		setError("");
		setSuccessMessage("");

		if (!validateEvent()) return;

		try {
			setLoading(true);
			const endpoint = editingEvent ? `/events/${editingEvent._id}` : "/events";
			const method = editingEvent ? "put" : "post";

			await api[method](endpoint, newEvent);

			setSuccessMessage(
				`Event successfully ${editingEvent ? "updated" : "created"}!`,
			);
			resetEventForm();
			fetchEvents();
		} catch (error) {
			setError(error.response?.data?.error || "Failed to save event");
		} finally {
			setLoading(false);
		}
	};

	const resetEventForm = () => {
		setNewEvent({
			name: "",
			type: "online",
			description: "",
			location: "",
			startDate: "",
			endDate: "",
			questions: [],
			maxParticipants: 0,
		});
		setEditingEvent(null);
	};

	const handleEditEvent = (event) => {
		setEditingEvent(event);
		setNewEvent({
			...event,
			startDate: new Date(event.startDate).toISOString().slice(0, 16),
			endDate: new Date(event.endDate).toISOString().slice(0, 16),
		});
	};

	const handleDeleteEvent = async (eventId) => {
		if (!window.confirm("Are you sure you want to delete this event?")) return;

		try {
			await api.delete(`/events/${eventId}`);
			setSuccessMessage("Event successfully deleted!");
			fetchEvents();
		} catch (error) {
			setError(error.response?.data?.error || "Failed to delete event");
		}
	};

	return (
		<div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-200">Admin Dashboard - Event Management</h1>

            {error && (
				<div className="mb-4 p-4 text-red-800 bg-red-100 rounded">
					{error}
				</div>
			)}

			{successMessage && (
				<div className="mb-4 p-4 text-green-800 bg-green-100 rounded">
					{successMessage}
				</div>
			)}

            <div className="mb-4 flex gap-4">
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="p-2 border rounded"
                >
                    <option value="all">All Events</option>
                    <option value="online">Online Events</option>
                    <option value="offline">Offline Events</option>
                </select>

                <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyUp={(e) => e.key === "Enter" && fetchEvents()}
                    className="p-2 border rounded flex-grow"
                />
            </div>

			<div className="bg-white p-6 rounded-lg shadow-lg">
				<h2 className="text-xl font-semibold mb-4">Current Events</h2>
				{loading ? (
					<div className="text-center py-4">Loading...</div>
				) : (
					<div className="space-y-4">
						{events.length === 0 ? (
							<p className="text-gray-500 text-center">No events found</p>
						) : (
							events.map((event) => (
								<div
									key={event._id}
									className="border p-4 rounded hover:bg-gray-50"
								>
									<div className="flex justify-between items-start">
										<div>
											<h3 className="font-medium">{event.name}</h3>
											<p className="text-sm text-gray-600">
												{event.type} event |{" "}
												{new Date(event.startDate).toLocaleDateString()} -{" "}
												{new Date(event.endDate).toLocaleDateString()}
											</p>
											<p className="mt-2">{event.description}</p>
										</div>
										<div className="space-x-2">
											<button
												onClick={() => handleEditEvent(event)}
												className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
											>
												Edit
											</button>
											<button
												onClick={() => handleDeleteEvent(event._id)}
												className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
											>
												Delete
											</button>
										</div>
									</div>
								</div>
							))
						)}
					</div>
				)}
			</div>

			<div className="bg-white p-6 rounded-lg shadow-lg my-6">
				<h2 className="text-xl font-semibold mb-4">
					{editingEvent ? "Edit Event" : "Create New Event"}
				</h2>
				<form onSubmit={handleCreateEvent} className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1">
							Event Name *
						</label>
						<input
							type="text"
							value={newEvent.name}
							onChange={(e) =>
								setNewEvent((prev) => ({ ...prev, name: e.target.value }))
							}
							className="w-full p-2 border rounded"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">
							Description *
						</label>
						<textarea
							value={newEvent.description}
							onChange={(e) =>
								setNewEvent((prev) => ({
									...prev,
									description: e.target.value,
								}))
							}
							className="w-full p-2 border rounded"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">Type *</label>
						<select
							value={newEvent.type}
							onChange={(e) =>
								setNewEvent((prev) => ({ ...prev, type: e.target.value }))
							}
							className="w-full p-2 border rounded"
						>
							<option value="online">Online</option>
							<option value="offline">Offline</option>
						</select>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium mb-1">
								Start Date *
							</label>
							<input
								type="datetime-local"
								value={newEvent.startDate}
								onChange={(e) =>
									setNewEvent((prev) => ({
										...prev,
										startDate: e.target.value,
									}))
								}
								className="w-full p-2 border rounded"
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">
								End Date *
							</label>
							<input
								type="datetime-local"
								value={newEvent.endDate}
								onChange={(e) =>
									setNewEvent((prev) => ({ ...prev, endDate: e.target.value }))
								}
								className="w-full p-2 border rounded"
								required
							/>
						</div>
					</div>

					{newEvent.type === "offline" && (
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">
									Location *
								</label>
								<input
									type="text"
									value={newEvent.location}
									onChange={(e) =>
										setNewEvent((prev) => ({
											...prev,
											location: e.target.value,
										}))
									}
									className="w-full p-2 border rounded"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">
									Maximum Participants *
								</label>
								<input
									type="number"
									value={newEvent.maxParticipants}
									onChange={(e) =>
										setNewEvent((prev) => ({
											...prev,
											maxParticipants: parseInt(e.target.value),
										}))
									}
									className="w-full p-2 border rounded"
									min="1"
									required
								/>
							</div>
						</div>
					)}

					{newEvent.type === "online" && (
						<div className="space-y-4">
							<h3 className="text-lg font-medium">Questions</h3>
							{newEvent.questions.map((q, index) => (
								<div key={index} className="p-4 bg-gray-50 rounded">
									<p>
										<strong>Q:</strong> {q.question}
									</p>
									<p>
										<strong>A:</strong> {q.answer}
									</p>
									<p>
										<strong>Options:</strong>
									</p>
									<ul className="list-disc ml-4">
										{q.options.map((option, i) => (
											<li key={i}>{option}</li>
										))}
									</ul>
								</div>
							))}

							<div className="space-y-2">
								<input
									type="text"
									placeholder="Question *"
									value={currentQuestion.question}
									onChange={(e) =>
										setCurrentQuestion((prev) => ({
											...prev,
											question: e.target.value,
										}))
									}
									className="w-full p-2 border rounded"
								/>
								<input
									type="text"
									placeholder="Correct Answer *"
									value={currentQuestion.answer}
									onChange={(e) =>
										setCurrentQuestion((prev) => ({
											...prev,
											answer: e.target.value,
										}))
									}
									className="w-full p-2 border rounded"
								/>
								{currentQuestion.options.map((option, index) => (
									<input
										key={index}
										type="text"
										placeholder={`Option ${index + 1} ${index < 2 ? "*" : ""}`}
										value={option}
										onChange={(e) => handleOptionChange(index, e.target.value)}
										className="w-full p-2 border rounded"
									/>
								))}
								<button
									type="button"
									onClick={handleAddQuestion}
									className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
								>
									Add Question
								</button>
							</div>
						</div>
					)}

					<button
						type="submit"
						className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
					>
						{editingEvent ? "Update Event" : "Create Event"}
					</button>
				</form>
			</div>

			
		</div>
	);
};

export default Admin;
