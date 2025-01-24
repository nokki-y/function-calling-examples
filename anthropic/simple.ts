import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

async function main() {
	if (!process.env.ANTHROPIC_API_KEY) {
		throw new Error("ANTHROPIC_API_KEY is not set in .env file");
	}

	const anthropic = new Anthropic({
		apiKey: process.env.ANTHROPIC_API_KEY,
	});

	try {
		const message = await anthropic.messages.create({
			model: "claude-3-opus-20240229",
			max_tokens: 1000,
			messages: [
				{
					role: "user",
					content: "TypeScriptについて説明してください。",
				},
			],
		});

		console.log(
			"Response:",
			message.content[0].type === "text" ? message.content[0].text : "",
		);
	} catch (error) {
		console.error("Error:", error);
	}
}

main();
