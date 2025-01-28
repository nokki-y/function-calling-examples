import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { type WeatherInput, getWeather } from "../functions/get_weather";

dotenv.config();

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

// 基本パターン
async function basicToolUse() {
	const tools = [
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
	const message = await anthropic.messages.create({
		model: "claude-3-5-sonnet-20241022",
		max_tokens: 1000,
		messages: [
			{
				role: "user",
				content: "東京の天気は？",
			},
		],
		tools,
	});
	console.log("Response:", JSON.stringify(message, null, 2));

	// ツールの実行
	if (message.stop_reason === "tool_use") {
		const toolContent = message.content[message.content.length - 1];
		if (toolContent.type === "tool_use") {
			try {
				const toolArgs = toolContent.input as WeatherInput;

				console.log(
					`ツール実行..天気を取得...引数: ${JSON.stringify(toolArgs)}`,
				);
				const weatherResult = await getWeather(toolArgs);
				console.log("Weather Result:", JSON.stringify(weatherResult, null, 2));
			} catch (error) {
				console.error("Weather API Error:", error);
			}
		}
	}
}

basicToolUse().catch(console.error);
