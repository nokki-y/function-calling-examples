interface DataResponse {
	id: string;
	data: string;
	timestamp: string;
}

export async function getData(id: string): Promise<DataResponse> {
	// 処理時間をシミュレート（0.5〜2秒）
	const delay = Math.random() * 1500 + 500;
	await new Promise((resolve) => setTimeout(resolve, delay));

	return {
		id,
		data: `Data for ID: ${id}`,
		timestamp: new Date().toISOString(),
	};
}
