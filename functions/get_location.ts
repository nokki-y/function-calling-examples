interface LocationResponse {
	location: string;
}

export async function getLocation(): Promise<LocationResponse> {
	// 日本の主要都市からランダムに選択
	const cities = ["東京", "大阪", "名古屋", "福岡", "札幌", "仙台"];
	const randomCity = cities[Math.floor(Math.random() * cities.length)];

	return { location: randomCity };
}
