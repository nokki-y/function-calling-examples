export interface UserData {
	name: string;
	age: number;
	email?: string;
}

export function formatUserData(data: UserData): UserData {
	// 必須フィールドの検証
	if (!data.name || !data.age) {
		throw new Error("名前と年齢は必須です");
	}

	// 年齢の検証
	if (data.age < 0 || data.age > 150) {
		throw new Error("不正な年齢です");
	}

	// メールアドレスの検証（存在する場合）
	if (data.email && !data.email.includes("@")) {
		throw new Error("不正なメールアドレス形式です");
	}

	// データを整形して返却
	return {
		name: data.name.trim(),
		age: Math.floor(data.age), // 整数に変換
		...(data.email && { email: data.email.trim().toLowerCase() }), // メールアドレスがある場合のみ含める
	};
}
