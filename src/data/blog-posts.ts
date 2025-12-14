import { User, users } from '../consts';

// Define a Post class to standardize blog post data structure
export class Post {
	title: string;
	url: string;
	pubDate: Date;
	authors: User[];
	heroImage?: string;
	draft: boolean;
	tags: string[];

	constructor(
		title: string,
		url: string,
		pubDate: Date,
		authors: User[],
		heroImage?: string,
		draft: boolean = false,
		tags: string[] = []
	) {
		this.title = title;
		this.url = url;
		this.pubDate = pubDate;
		this.authors = authors;
		this.heroImage = heroImage;
		this.draft = draft;
		this.tags = tags;
	}
}

// Define external blog posts
export const externalPosts = [
	new Post(
		"Event Loops, Multi-threading and Multi-processing",
		"https://medium.com/@thehellmaker/event-loops-multi-threading-and-multi-processing-b57e65cf364f",
		new Date("2025-02-09"),
		[users.get("thehellmaker")!, users.get("rajsiba")!],
		"/eventloops-multi-threading-processing.jpg",
		false,
		["python", "concurrency"]
	),
	new Post(
		"Setting Up DeepSeek-R1 671B for Distributed Multi-Node, Multi-GPU Inference with VLLM and Ray",
		"https://github.com/thehellmaker/llm-experiments/blob/main/deepseek-r1/README.md",
		new Date("2025-02-16"),
		[users.get("thehellmaker")!],
		"/deepseek-671b.jpg",
		false,
		["machine-learning", "distributed-systems"]
	)
]; 