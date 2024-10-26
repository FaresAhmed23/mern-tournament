import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import pic from "../assets/getty.jpg";

const Home = () => {
	return (
		<div>
			<Navbar />
			<div className="p-4 lg:mb-36 text-gray-200 mx-16 mt-16">
				<div className="flex flex-wrap lg:flex-row-reverse">
					<div className="w-full lg:w-1/2">
						<div className="flex justify-center lg:p-8">
							<div>
								<img
									src={pic}
									alt="fares"
									className="border border-stone-900 rounded-3xl"
									priority
								/>
							</div>
						</div>
					</div>
					<div className="w-full lg:w-1/2">
						<div className="flex flex-col items-center lg:items-start mt-10">
							<h2 className="pb-2 text-4xl tracking-tighter lg:text-8xl kablammo-ff">
								Devour
							</h2>
							<span className="bg-gradient-to-r from-stone-300 to-gray-600 bg-clip-text text-3xl tracking-tight text-transparent">
								A Tournament Scoring System
							</span>
							<p className="my-2 max-w-lg py-6 text-xl leading-relaxed tracking-tighter">
								Welcome to <span className="kablammo-ff text-blue-500">Devour</span>, the ultimate tournament scoring system
								designed for competitive events. From
								real-time score updates to detailed participant stats, <span className="kablammo-ff text-blue-500">Devour</span> is
								built to enhance the tournament experience for organizers,
								players, and audiences alike. With a sleek, user-friendly
								interface, tracking scores and achievements across multiple
								events has never been easier. Discover how <span className="kablammo-ff text-blue-500">Devour</span> brings
								transparency and excitement to every competition.
							</p>

							<button className="bg-white rounded-full p-3 text-sm text-stone-800 mb-10 border-2 hover:bg-stone-800 hover:text-stone-200 transition-all duration-150">
								<Link to={"/events"}>View Events</Link>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Home;
