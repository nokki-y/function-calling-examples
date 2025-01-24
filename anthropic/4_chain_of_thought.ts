import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

// Chain of Thoughtパターン
async function chainOfThoughtToolUse() {
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

	const systemPrompt = `
    ツールを使用する前に、以下のステップで考えてください：
    1. 必要な情報は何か
    2. どのツールを使うべきか
    3. パラメータは適切か
    4. 結果をどのように解釈するか
  `;

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
		system: systemPrompt,
	});

	console.log("Response:", JSON.stringify(message, null, 2));
}

chainOfThoughtToolUse().catch(console.error);
