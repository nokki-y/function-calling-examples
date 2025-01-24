import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// エラーハンドリングパターン
async function errorHandlingFunctionCalling() {
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

	try {
		const response = await openai.chat.completions.create({
			model: "gpt-4-turbo-preview",
			messages: [
				{
					role: "user",
					content: "天気を教えて",
				},
			],
			tools: functions.map((func) => ({
				type: "function",
				function: func,
			})),
		});

		console.log("Response:", JSON.stringify(response, null, 2));

		const message = response.choices[0].message;
		if (message.tool_calls && message.tool_calls.length > 0) {
			try {
				// ツール実行をシミュレート
				const result = await executeWeatherTool(message.tool_calls[0]);

				// 結果を使って続きの会話
				const finalResponse = await openai.chat.completions.create({
					model: "gpt-4-turbo-preview",
					messages: [
						{
							role: "user",
							content: "天気を教えて",
						},
						message,
						{
							role: "function",
							name: "get_weather",
							content: JSON.stringify(result),
						},
					],
					tools: functions.map((func) => ({
						type: "function",
						function: func,
					})),
				});

				console.log("Final Response:", finalResponse);
			} catch (toolError) {
				console.error("ツール実行エラー:", toolError);
				// フォールバック処理
				const fallbackResponse = await openai.chat.completions.create({
					model: "gpt-4-turbo-preview",
					messages: [
						{
							role: "user",
							content:
								"すみません、天気情報の取得に失敗しました。一般的な天気の傾向を教えてください。",
						},
					],
				});
				console.log("Fallback Response:", fallbackResponse);
			}
		}
	} catch (error) {
		console.error("APIエラー:", error);
		throw new Error("天気情報の取得に失敗しました");
	}
}

// 天気ツールの実行をシミュレート
async function executeWeatherTool(
	toolCall: OpenAI.Chat.ChatCompletionMessageToolCall,
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

errorHandlingFunctionCalling().catch(console.error);
