import dotenv from "dotenv";
import OpenAI from "openai";
import { getLocation } from "../functions/get_location";
import { getWeather } from "../functions/get_weather";

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

	console.log("モデルに問い合わせ...");
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
		try {
			console.log("ツール実行..位置情報を取得...");
			const locationResult = await getLocation();
			console.log("Location Result:", JSON.stringify(locationResult, null, 2));

			console.log("モデルに問い合わせ...(最終応答)");
			const weatherResponse = await openai.chat.completions.create({
				model: "gpt-4-turbo-preview",
				messages: [
					{
						role: "user",
						content: "現在地の天気を教えて",
					},
					locationMessage,
					{
						role: "tool",
						tool_call_id: locationMessage.tool_calls[0].id,
						content: JSON.stringify(locationResult),
					},
				],
				tools: functions.map((func) => ({
					type: "function",
					function: func,
				})),
			});
			console.log(
				"Weather Response:",
				JSON.stringify(weatherResponse, null, 2),
			);

			// 天気情報の取得
			const weatherMessage = weatherResponse.choices[0].message;
			if (weatherMessage.tool_calls && weatherMessage.tool_calls.length > 0) {
				const toolCall = weatherMessage.tool_calls[0];
				const toolArgs = JSON.parse(toolCall.function.arguments);

				console.log(
					`ツール実行..天気を取得...引数: ${JSON.stringify(toolArgs)}`,
				);
				const weatherResult = await getWeather(toolArgs);
				console.log("Weather Result:", JSON.stringify(weatherResult, null, 2));
			}
		} catch (error) {
			console.error("Error:", error);
		}
	}
}

sequentialFunctionCalling().catch(console.error);
