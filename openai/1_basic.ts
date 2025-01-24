import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// 基本パターン
async function basicFunctionCalling() {
	const functions = [
		{
			name: "get_weather",
			description: "指定された場所の天気情報を取得します",
			parameters: {
				type: "object",
				properties: {
					location: {
						type: "string",
						description: "場所（例：東京）",
					},
				},
				required: ["location"],
			},
		},
	];

	const response = await openai.chat.completions.create({
		model: "gpt-4-turbo-preview",
		messages: [
			{
				role: "user",
				content: "東京の天気は？",
			},
		],
		tools: functions.map((func) => ({
			type: "function",
			function: func,
		})),
	});

	console.log("Response:", JSON.stringify(response, null, 2));
}

basicFunctionCalling().catch(console.error);
