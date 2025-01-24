import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// シーケンシャル実行パターン
async function sequentialFunctionCalling() {
	const functions = [
		{
			name: "get_location",
			description: "ユーザーの現在位置を取得します",
			parameters: {
				type: "object",
				properties: {},
				required: [],
			},
		},
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

	// 最初の関数実行（位置情報取得）
	const locationResponse = await openai.chat.completions.create({
		model: "gpt-4-turbo-preview",
		messages: [
			{
				role: "user",
				content: "現在地の天気を教えて",
			},
		],
		tools: functions.map((func) => ({
			type: "function",
			function: func,
		})),
	});

	console.log("Location Response:", JSON.stringify(locationResponse, null, 2));
	const locationMessage = locationResponse.choices[0].message;

	// 位置情報を使って天気を取得
	if (locationMessage.tool_calls && locationMessage.tool_calls.length > 0) {
		// 位置情報取得の結果をシミュレート
		const location = "東京";

		const weatherResponse = await openai.chat.completions.create({
			model: "gpt-4-turbo-preview",
			messages: [
				{
					role: "user",
					content: "現在地の天気を教えて",
				},
				locationMessage,
				{
					role: "function",
					name: "get_location",
					content: JSON.stringify({ location }),
				},
			],
			tools: functions.map((func) => ({
				type: "function",
				function: func,
			})),
		});

		console.log("Final Response:", JSON.stringify(weatherResponse, null, 2));
	}
}

sequentialFunctionCalling().catch(console.error);
