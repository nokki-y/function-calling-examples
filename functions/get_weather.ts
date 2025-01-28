export interface WeatherInput {
	location: string;
}

export interface WeatherResponse {
	weather: string;
}

export async function getWeather(
	input: WeatherInput,
): Promise<WeatherResponse> {
	// 天気のパターンをランダムに生成
	const weatherPatterns = ["晴れ", "曇り", "雨", "雪"];
	const randomWeather =
		weatherPatterns[Math.floor(Math.random() * weatherPatterns.length)];

	return { weather: randomWeather };
}
