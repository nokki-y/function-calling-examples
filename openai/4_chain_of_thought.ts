import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Chain of Thoughtパターン
async function chainOfThoughtFunctionCalling() {
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

	const systemMessage = `
    関数を呼び出す前に、以下のステップで考えてください：
    1. 必要な情報は何か
    2. どの関数を使うべきか
    3. パラメータは適切か
    4. 結果をどのように解釈するか
  `;

	const response = await openai.chat.completions.create({
		model: "gpt-4-turbo-preview",
		messages: [
			{
				role: "system",
				content: systemMessage,
			},
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
}

chainOfThoughtFunctionCalling().catch(console.error);
