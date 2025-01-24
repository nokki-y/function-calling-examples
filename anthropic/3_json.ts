import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

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
}

jsonToolUse().catch(console.error);
