import dotenv from "dotenv";
import OpenAI from "openai";

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
}

jsonFunctionCalling().catch(console.error);
