import "dotenv/config";
import OpenAI from "openai";

async function main() {
	if (!process.env.OPENAI_API_KEY) {
		throw new Error("OPENAI_API_KEY is not set in .env file");
	}

	const openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	});

	try {
		const response = await openai.chat.completions.create({
			model: "gpt-4-turbo-preview",
			messages: [
				{
					role: "user",
					content: "TypeScriptについて説明してください。",
				},
			],
			max_tokens: 1000,
		});

		console.log("Response:", response.choices[0]?.message?.content || "");
	} catch (error) {
		console.error("Error:", error);
	}
}

main();
