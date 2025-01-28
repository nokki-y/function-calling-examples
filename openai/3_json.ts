import dotenv from "dotenv";
import OpenAI from "openai";
import { formatUserData } from "../functions/format_user_data";

dotenv.config();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// JSON特化パターン
async function jsonFunctionCalling() {
	const functions = [
		{
			name: "format_user_data",
			description: "ユーザーデータをJSON形式に整形します",
			parameters: {
				type: "object",
				properties: {
					name: {
						type: "string",
						description: "ユーザー名",
					},
					age: {
						type: "number",
						description: "年齢",
					},
					email: {
						type: "string",
						description: "メールアドレス",
					},
				},
				required: ["name", "age"],
			},
		},
	];

	console.log("モデルに問い合わせ...");
	const response = await openai.chat.completions.create({
		model: "gpt-4-turbo-preview",
		messages: [
			{
				role: "user",
				content: "ユーザー情報を整形して：山田太郎、30歳、yamada@example.com",
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
			console.log(
				`ツール実行..ユーザーデータを整形...引数: ${JSON.stringify(toolArgs)}`,
			);
			const formattedData = formatUserData(toolArgs);
			console.log("Formatted Data:", JSON.stringify(formattedData, null, 2));

			// フォーマット結果を使って最終的な応答を生成
			console.log("モデルに問い合わせ...(最終応答)");
			const finalResponse = await openai.chat.completions.create({
				model: "gpt-4-turbo-preview",
				messages: [
					{
						role: "user",
						content:
							"ユーザー情報を整形して：山田太郎、30歳、yamada@example.com",
					},
					message,
					{
						role: "tool",
						tool_call_id: toolCall.id,
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

jsonFunctionCalling().catch(console.error);
