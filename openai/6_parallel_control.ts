import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// 並列実行制御パターン
class FunctionExecutionController {
	private isExecuting = false;
	private queue: Array<() => Promise<void>> = [];

	async execute(task: () => Promise<void>): Promise<void> {
		if (this.isExecuting) {
			// タスクをキューに追加
			return new Promise((resolve) => {
				this.queue.push(async () => {
					await task();
					resolve();
				});
			});
		}

		this.isExecuting = true;
		try {
			await task();
		} finally {
			this.isExecuting = false;
			// キューの次のタスクを実行
			if (this.queue.length > 0) {
				const nextTask = this.queue.shift();
				if (nextTask) {
					await this.execute(nextTask);
				}
			}
		}
	}
}

async function parallelControlFunctionCalling() {
	const functions = [
		{
			name: "get_data",
			description: "データを取得します（並列実行不可）",
			parameters: {
				type: "object",
				properties: {
					id: {
						type: "string",
						description: "データID",
					},
				},
				required: ["id"],
			},
		},
	];

	const controller = new FunctionExecutionController();

	// 複数のリクエストをシミュレート
	const requests = ["1", "2", "3"].map(async (id) => {
		return controller.execute(async () => {
			const response = await openai.chat.completions.create({
				model: "gpt-4-turbo-preview",
				messages: [
					{
						role: "user",
						content: `ID ${id} のデータを取得して`,
					},
				],
				tools: functions.map((func) => ({
					type: "function",
					function: func,
				})),
			});

			console.log("Response:", JSON.stringify(response, null, 2));
			const message = response.choices[0].message;
		});
	});

	await Promise.all(requests);
}

parallelControlFunctionCalling().catch(console.error);
