import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

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

	// 最初のツール実行（位置情報取得）
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

	// 位置情報を使って天気を取得
	const firstContent = locationResponse.content[0];
	if ("tool_use" in firstContent) {
		// 位置情報取得の結果をシミュレート
		const location = "東京";

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
					content: JSON.stringify(firstContent.tool_use),
				},
				{
					role: "user",
					content: JSON.stringify({ location }),
				},
			],
			tools,
		});

		console.log("Final Response:", JSON.stringify(weatherResponse, null, 2));
	}
}

sequentialToolUse().catch(console.error);
