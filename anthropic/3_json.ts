import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { type UserData, formatUserData } from "../functions/format_user_data";

dotenv.config();

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

// JSON特化パターン
async function jsonToolUse() {
	const tools = [
		{
			name: "format_user_data",
			description: "ユーザーデータをJSON形式に整形します",
			input_schema: {
				type: "object" as const,
				properties: {
					name: {
						type: "string" as const,
						description: "ユーザー名",
					},
					age: {
						type: "number" as const,
						description: "年齢",
					},
					email: {
						type: "string" as const,
						description: "メールアドレス",
					},
				},
				required: ["name", "age"],
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
				content: "ユーザー情報を整形して：山田太郎、30歳、yamada@example.com",
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
				const toolArgs = toolContent.input as UserData;
				console.log(
					`ツール実行..ユーザーデータを整形...引数: ${JSON.stringify(toolArgs)}`,
				);
				const formattedData = formatUserData(toolArgs);
				console.log("Formatted Data:", JSON.stringify(formattedData, null, 2));

				// フォーマット結果を使って最終的な応答を生成
				console.log("モデルに問い合わせ...(最終応答)");
				const finalResponse = await anthropic.messages.create({
					model: "claude-3-5-sonnet-20241022",
					max_tokens: 1000,
					messages: [
						{
							role: "user",
							content:
								"ユーザー情報を整形して：山田太郎、30歳、yamada@example.com",
						},
						{
							role: "assistant",
							content: JSON.stringify(toolContent),
						},
						{
							role: "user",
							content: JSON.stringify(formattedData),
						},
					],
				});

				console.log("Final Response:", JSON.stringify(finalResponse, null, 2));
			} catch (error) {
				console.error("Format Error:", error);
			}
		}
	}
}

jsonToolUse().catch(console.error);
