import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { getLocation } from "../functions/get_location";
import { type WeatherInput, getWeather } from "../functions/get_weather";

dotenv.config();

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

// シーケンシャル実行パターン
async function sequentialToolUse() {
	const tools = [
		{
			name: "get_location",
			description: "ユーザーの現在位置を取得します",
			input_schema: {
				type: "object" as const,
				properties: {},
				required: [],
			},
		},
		{
			name: "get_weather",
			description: "指定された場所の天気情報を取得します",
			input_schema: {
				type: "object" as const,
				properties: {
					location: {
						type: "string" as const,
						description: "場所（例：東京）",
					},
				},
				required: ["location"],
			},
		},
	];

	console.log("モデルに問い合わせ...");
	const locationResponse = await anthropic.messages.create({
		model: "claude-3-5-sonnet-20241022",
		max_tokens: 1000,
		messages: [
			{
				role: "user",
				content: "現在地の天気を教えて",
			},
		],
		tools,
	});
	console.log("Location Response:", JSON.stringify(locationResponse, null, 2));

	// 位置情報を使って天気を取得
	if (locationResponse.stop_reason === "tool_use") {
		const locationContent =
			locationResponse.content[locationResponse.content.length - 1];
		if (locationContent.type === "tool_use") {
			try {
				console.log("ツール実行..位置情報を取得...");
				const locationResult = await getLocation();
				console.log(
					"Location Result:",
					JSON.stringify(locationResult, null, 2),
				);

				console.log("モデルに問い合わせ...(最終応答)");
				const weatherResponse = await anthropic.messages.create({
					model: "claude-3-5-sonnet-20241022",
					max_tokens: 1000,
					messages: [
						{
							role: "user",
							content: "現在地の天気を教えて",
						},
						{
							role: "assistant",
							content: JSON.stringify(locationContent),
						},
						{
							role: "user",
							content: JSON.stringify(locationResult),
						},
					],
					tools,
				});
				console.log(
					"Weather Response:",
					JSON.stringify(weatherResponse, null, 2),
				);

				// 天気情報の取得
				if (weatherResponse.stop_reason === "tool_use") {
					const weatherContent =
						weatherResponse.content[weatherResponse.content.length - 1];
					if (weatherContent.type === "tool_use") {
						const toolArgs = weatherContent.input as WeatherInput;

						console.log(
							`ツール実行..天気を取得...引数: ${JSON.stringify(toolArgs)}`,
						);
						const weatherResult = await getWeather(toolArgs);
						console.log(
							"Weather Result:",
							JSON.stringify(weatherResult, null, 2),
						);
					}
				}
			} catch (error) {
				console.error("Error:", error);
			}
		}
	}
}

sequentialToolUse().catch(console.error);
