import dotenv from "dotenv";
import OpenAI from "openai";
import { getWeather } from "../functions/get_weather";

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

	console.log("モデルに問い合わせ...");
	const response = await openai.chat.completions.create({
		model: "gpt-4o-mini",
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

	// ツールの実行
	const message = response.choices[0].message;
	if (message.tool_calls && message.tool_calls.length > 0) {
		const toolCall = message.tool_calls[0];
		try {
			const toolArgs = JSON.parse(toolCall.function.arguments);

			console.log(`ツール実行..天気を取得...引数: ${JSON.stringify(toolArgs)}`);
			const weatherResult = await getWeather(toolArgs);
			console.log("Weather Result:", JSON.stringify(weatherResult, null, 2));
		} catch (error) {
			console.error("Weather API Error:", error);
		}
	}
}

basicFunctionCalling().catch(console.error);
