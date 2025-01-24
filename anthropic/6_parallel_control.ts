import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

// 並列実行制御パターン
class ToolExecutionController {
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

async function parallelControlToolUse() {
	const tools = [
		{
			name: "get_data",
			description: "データを取得します（並列実行不可）",
			input_schema: {
				type: "object" as const,
				properties: {
					id: {
						type: "string" as const,
						description: "データID",
					},
				},
				required: ["id"],
			},
		},
	];

	const controller = new ToolExecutionController();

	// 複数のリクエストをシミュレート
	const requests = ["1", "2", "3"].map(async (id) => {
		return controller.execute(async () => {
			const message = await anthropic.messages.create({
				model: "claude-3-5-sonnet-20241022",
				max_tokens: 1000,
				messages: [
					{
						role: "user",
						content: `ID ${id} のデータを取得して`,
					},
				],
				tools,
			});

			console.log(`Response for ID ${id}:`, JSON.stringify(message, null, 2));
		});
	});

	await Promise.all(requests);
}

parallelControlToolUse().catch(console.error);
