import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

// エラーハンドリングパターン
async function errorHandlingToolUse() {
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

	try {
		const message = await anthropic.messages.create({
			model: "claude-3-5-sonnet-20241022",
			max_tokens: 1000,
			messages: [
				{
					role: "user",
					content: "天気を教えて",
				},
			],
			tools,
		});

		const firstContent = message.content[0];
		if ("tool_use" in firstContent) {
			try {
				// ツール実行をシミュレート
				const result = await executeWeatherTool(firstContent.tool_use);

				// 結果を使って続きの会話
				const finalMessage = await anthropic.messages.create({
					model: "claude-3-5-sonnet-20241022",
					max_tokens: 1000,
					messages: [
						{
							role: "user",
							content: "天気を教えて",
						},
						{
							role: "assistant",
							content: JSON.stringify(firstContent.tool_use),
						},
						{
							role: "user",
							content: JSON.stringify(result),
						},
					],
					tools,
				});

				console.log("Final Response:", JSON.stringify(finalMessage, null, 2));
			} catch (toolError) {
				console.error("ツール実行エラー:", toolError);
				// フォールバック処理
				const fallbackMessage = await anthropic.messages.create({
					model: "claude-3-5-sonnet-20241022",
					max_tokens: 1000,
					messages: [
						{
							role: "user",
							content:
								"すみません、天気情報の取得に失敗しました。一般的な天気の傾向を教えてください。",
						},
					],
				});
				console.log(
					"Fallback Response:",
					JSON.stringify(fallbackMessage, null, 2),
				);
			}
		}
	} catch (error) {
		console.error("APIエラー:", error);
		throw new Error("天気情報の取得に失敗しました");
	}
}

// 天気ツールの実行をシミュレート
async function executeWeatherTool(
	toolUse: unknown,
): Promise<{ weather: string }> {
	// 実際のAPIコールをシミュレート
	return new Promise((resolve, reject) => {
		const shouldFail = Math.random() > 0.5;
		if (shouldFail) {
			reject(new Error("天気APIの呼び出しに失敗しました"));
		} else {
			resolve({ weather: "晴れ" });
		}
	});
}

errorHandlingToolUse().catch(console.error);
