# AIエージェントの内部処理を理解するために - Function Callingを正しく理解する -

> この記事で紹介するサンプルコードは、[GitHub](https://github.com/nokki-y/function-calling-examples)で公開しています。
> なお、記事内ではAnthropicのFunction Callingを中心に解説しますが、サンプルコードリポジトリにはOpenAI APIを使用した同様の実装パターンも含まれています。


## 1. はじめに

最近、様々なAIエージェントが登場し話題になっていますが、その中核を担う技術の一つが『Function Calling』です。

本記事では、AIエージェントの内部動作、特にAnthropicのFunction Calling（Tool Use）に焦点を当て、その仕組みと実装方法について解説します。

### AIエージェントとは

まず、AIエージェントとは、ユーザーの指示に基づいて自律的にタスクを実行するAIシステムです。これらは単なる質問応答だけでなく、外部APIの呼び出し、データの処理、さらには複雑な意思決定まで行うことができます。

### Function Callingの重要性

Function Callingは、AIモデルが外部の関数やAPIを呼び出すための機能です。

**これにより、AIは：**

- テキスト生成以外の具体的なアクション実行
- 外部システムとの連携
- 構造化されたデータの処理

などが可能になります。

### 本記事の目的

**この記事では、以下の内容を目指します：**

- Function Callingの基本概念の理解
- AnthropicのFunction Calling実装方法の習得
- 実践的な実装パターンの紹介


## 2. Function Callingの基礎

### AnthropicとOpenAIのFunction Calling比較

今回は主題としては取り上げませんが、OpenAIのFunction Callingも同様の機能を提供しているので、補足情報として比較してみます。

|  | Anthropic | OpenAI |
|------|-----------|--------|
| 呼び方 | Tool Use | Function Calling |
| スキーマ定義 | JSON Schema | JSON Schema |
| 思考プロセス | Chain of Thoughtサポート | 基本的な実行のみ |


## 3. Anthropic APIの基本

### APIの基本的な使い方

AnthropicのAPIを使用するための基本的な手順を説明します。

1. **クライアントの初期化**：
   - SDKをインポートし、API keyを使用してクライアントを初期化します
     - 今回はAPI keyを環境変数から読み込みます

2. **メッセージの作成**：
   - `messages.create()`メソッドを使用して、AIとの対話を開始します
   - 必須パラメータ：
     - `model`: 使用するAIモデル（例：claude-3-5-sonnet）
     - `messages`: ユーザーからの入力メッセージ
   - オプションパラメータ：
     - `max_tokens`: 生成するトークンの最大数
     - `tools`: Function Calling用のツール定義

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function sample() {
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: "こんにちは！",
    }],
  });
}
```


## 4. Function Callingの実装パターン

### 1. 基本パターン

基本的なFunction Callingの実装パターンです。単一のツールを定義し、それを使用するシンプルな例です。

- サンプルコード: [anthropic/1_basic.ts](https://github.com/nokki-y/function-calling-examples/blob/main/anthropic/1_basic.ts)

```typescript
async function basicToolUse() {
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

 console.log("モデルに問い合わせ...");
 const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1000,
  messages: [
   {
    role: "user",
    content: "東京の天気は？",
   },
  ],
  tools,
 });
 console.log("Response:", JSON.stringify(message, null, 2));

 // ツールの実行
 if (message.stop_reason === "tool_use") {
  const toolContent = message.content[message.content.length - 1];
  if (toolContent.type === "tool_use") {
   try {
    const toolArgs = toolContent.input as WeatherInput;

    console.log(
     `ツール実行..天気を取得...引数: ${JSON.stringify(toolArgs)}`,
    );
    const weatherResult = await getWeather(toolArgs);
    console.log("Weather Result:", JSON.stringify(weatherResult, null, 2));
   } catch (error) {
    console.error("Weather API Error:", error);
   }
  }
 }
}
```

#### 実行結果

```sh
モデルに問い合わせ...
Response: {
  "id": "msg_014gihSh5SPEqxd3k2HGN6PT",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet-20241022",
  "content": [
    {
      "type": "text",
      "text": "東京の天気情報を確認させていただきます。"
    },
    {
      "type": "tool_use",
      "id": "toolu_019b2yqYhic2AvBFiHJ2wmX7",
      "name": "get_weather",
      "input": {
        "location": "東京"
      }
    }
  ],
  "stop_reason": "tool_use",
  "stop_sequence": null,
  "usage": // 省略
}
ツール実行..天気を取得...引数: {"location":"東京"}
Weather Result: {
  "weather": "晴れ"
}
```

**ツールを使用しない場合はこうなります：**

```typescript
const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1000,
  messages: [{
    role: "user",
    content: "天気を教えて",  // 場所が指定されていない質問
  }],
  tools,
});
```

```json
Response: {
  "id": "msg_01BRCx8U5epMJ7ca7jmzmWE1",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet-20241022",
  "content": [
    {
      "type": "text",
      "text": "申し訳ありませんが、天気情報を取得するには具体的な場所を指定していただく必要があります。どちらの地域の天気をお知りになりたいですか？"
    }
  ],
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": // 省略
}
```

**この基本パターンの実行結果から、以下のことが分かります：**

- AIモデルは質問の内容に応じて、ツールの使用が必要かどうかを判断します
- ツールを使用する場合：
  - 質問から必要な情報（場所：東京）を適切に抽出しています
  - `stop_reason: "tool_use"`は、AIモデルがツールの使用を決定したことを示しています
  - `input`オブジェクトには、スキーマに従って適切なパラメータが設定されています
- ツールを使用しない場合：
  - 必要な情報が不足している場合は、ユーザーに追加情報を求めます
  - `stop_reason: "end_turn"`は、AIモデルが会話を継続することを示しています

### 2. シーケンシャル実行パターン

複数のツールを順番に実行するパターンです。前のツールの結果を次のツールの入力として使用します。

- サンプルコード: [anthropic/2_sequential.ts](https://github.com/nokki-y/function-calling-examples/blob/main/anthropic/2_sequential.ts)

```typescript
async function sequentialToolUse() {
 const tools = [
  {
   name: "get_location",
   description: "ユーザーの現在位置を取得します",
   input_schema: {
    type: "object" as const,
    properties: {},
    required: [],
   },
  },
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

 console.log("モデルに問い合わせ...");
 const locationResponse = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1000,
  messages: [
   {
    role: "user",
    content: "現在地の天気を教えて",
   },
  ],
  tools,
 });
 console.log("Location Response:", JSON.stringify(locationResponse, null, 2));

 // 位置情報を使って天気を取得
 if (locationResponse.stop_reason === "tool_use") {
  const locationContent =
   locationResponse.content[locationResponse.content.length - 1];
  if (locationContent.type === "tool_use") {
   try {
    console.log("ツール実行..位置情報を取得...");
    const locationResult = await getLocation();
    console.log(
     "Location Result:",
     JSON.stringify(locationResult, null, 2),
    );

    console.log("モデルに問い合わせ...(最終応答)");
    const weatherResponse = await anthropic.messages.create({
     model: "claude-3-5-sonnet-20241022",
     max_tokens: 1000,
     messages: [
      {
       role: "user",
       content: "現在地の天気を教えて",
      },
      {
       role: "assistant",
       content: JSON.stringify(locationContent),
      },
      {
       role: "user",
       content: JSON.stringify(locationResult),
      },
     ],
     tools,
    });
    console.log(
     "Weather Response:",
     JSON.stringify(weatherResponse, null, 2),
    );

    // 天気情報の取得
    if (weatherResponse.stop_reason === "tool_use") {
     const weatherContent =
      weatherResponse.content[weatherResponse.content.length - 1];
     if (weatherContent.type === "tool_use") {
      const toolArgs = weatherContent.input as WeatherInput;

      console.log(
       `ツール実行..天気を取得...引数: ${JSON.stringify(toolArgs)}`,
      );
      const weatherResult = await getWeather(toolArgs);
      console.log(
       "Weather Result:",
       JSON.stringify(weatherResult, null, 2),
      );
     }
    }
   } catch (error) {
    console.error("Error:", error);
   }
  }
 }
}
```

#### 実行結果

```sh
モデルに問い合わせ...
Location Response: {
  "id": "msg_01B7Kt1xVYUrzeoj2AUGritR",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet-20241022",
  "content": [
    {
      "type": "text",
      "text": "現在地の天気を調べるために、まず位置情報を取得してから天気情報を確認します。"
    },
    {
      "type": "tool_use",
      "id": "toolu_01PXQdfmJZEfUv2gA9wsPsbz",
      "name": "get_location",
      "input": {}
    }
  ],
  "stop_reason": "tool_use",
  "stop_sequence": null,
  "usage": // 省略
}
ツール実行..位置情報を取得...
Location Result: {
  "location": "札幌"
}
モデルに問い合わせ...(2回目)
Weather Response: {
  "id": "msg_01H1BkTmQhThq3JoKQBy1d7v",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet-20241022",
  "content": [
    {
      "type": "text",
      "text": "では、札幌の天気を確認してみましょう。"
    },
    {
      "type": "tool_use",
      "id": "toolu_01VewiXnpkpr3AfBYxuPKecU",
      "name": "get_weather",
      "input": {
        "location": "札幌"
      }
    }
  ],
  "stop_reason": "tool_use",
  "stop_sequence": null,
  "usage": // 省略
}
ツール実行..天気を取得...引数: {"location":"札幌"}
Weather Result: {
  "weather": "雪"
}
```

**シーケンシャル実行パターンの実行結果から、以下のことが分かります：**

- AIモデルは最初に説明文（text）を生成し、その後ツールを呼び出しています
- 複数のツールが定義されていても、必要なツールのみを選択して実行しています
- 前のツールの結果を考慮して、次のツールの入力を決定しています

### 3. JSON特化パターン

スキーマベースの型定義と検証機能を持つJSONデータの生成に特化したパターンです。

- サンプルコード: [anthropic/3_json.ts](https://github.com/nokki-y/function-calling-examples/blob/main/anthropic/3_json.ts)

```typescript
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

 console.log("モデルに問い合わせ...");
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

 // ツールの実行
 if (message.stop_reason === "tool_use") {
  const toolContent = message.content[message.content.length - 1];
  if (toolContent.type === "tool_use") {
   try {
    const toolArgs = toolContent.input as UserData;
    console.log(
     `ツール実行..ユーザーデータを整形...引数: ${JSON.stringify(toolArgs)}`,
    );
    const formattedData = formatUserData(toolArgs);
    console.log("Formatted Data:", JSON.stringify(formattedData, null, 2));

    // フォーマット結果を使って最終的な応答を生成
    console.log("モデルに問い合わせ...(最終応答)");
    const finalResponse = await anthropic.messages.create({
     model: "claude-3-5-sonnet-20241022",
     max_tokens: 1000,
     messages: [
      {
       role: "user",
       content:
        "ユーザー情報を整形して：山田太郎、30歳、yamada@example.com",
      },
      {
       role: "assistant",
       content: JSON.stringify(toolContent),
      },
      {
       role: "user",
       content: JSON.stringify(formattedData),
      },
     ],
    });

    console.log("Final Response:", JSON.stringify(finalResponse, null, 2));
   } catch (error) {
    console.error("Format Error:", error);
   }
  }
 }
}
```

#### 実行結果

```json
モデルに問い合わせ...
(node:29509) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
Response: {
  "id": "msg_01S8FiGQHjLBWDEUCogwEqTQ",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet-20241022",
  "content": [
    {
      "type": "text",
      "text": "ユーザー情報を整形するために、format_user_dataファンクションを使用します。提供された情報は以下の通りです：\n- 名前: 山田太郎\n- 年齢: 30\n- メールアドレス: yamada@example.com\n\nこれらの情報を使用してフォーマットします："
    },
    {
      "type": "tool_use",
      "id": "toolu_0138bv26hSgBXEL14Z2X1TJg",
      "name": "format_user_data",
      "input": {
        "name": "山田太郎",
        "age": 30,
        "email": "yamada@example.com"
      }
    }
  ],
  "stop_reason": "tool_use",
  "stop_sequence": null,
  "usage": // 省略
}
ツール実行..ユーザーデータを整形...引数: {"name":"山田太郎","age":30,"email":"yamada@example.com"}
Formatted Data: {
  "name": "山田太郎",
  "age": 30,
  "email": "yamada@example.com"
}
モデルに問い合わせ...(最終応答)
Final Response: {
  "id": "msg_01WaS7WCSktdgLniESUrtT94",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet-20241022",
  "content": [
    {
      "type": "text",
      "text": "ユーザー情報を整形しました:\n\n氏名: 山田太郎\n年齢: 30歳\nメール: yamada@example.com"
    }
  ],
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": // 省略
}
```

**JSON特化パターンの実行結果から、以下のことが分かります：**

- 非構造化テキストから必要な情報を抽出し、構造化データとして整形しています
- スキーマで定義された必須フィールド（name, age）に加え、オプショナルフィールド（email）も適切に処理しています
- 各フィールドの型（文字列、数値）が正しく設定されています


## 5. まとめ

今回は、AIエージェントの内部動作を理解するための第一歩として、Function Callingの基本的な実装パターンを紹介しました。

AIエージェントは、ユーザーの指示に基づいて自律的にタスクを実行するAIシステムです。タスクを実行するためには、ユーザーの指示を理解し、それに応じて複数のツールを駆使し、アクションを実行する必要があります。

そのため、今回紹介した以下のパターンは、AIエージェントの実装において最も基本的なパターンになります。

- シーケンシャル実行パターン: 複数ツールの順次実行
- JSON特化パターン: ユーザーの指示から必要な情報を抽出し、構造化データとして整形

### 今後の展望

その他のパターンが気になる方は、[こちらの公式ドキュメント](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)をご覧ください。

**今後の記事では、以下のような内容を予定しています：**

- AIエージェントの実装例と実践的なユースケース
- Cursorの内部処理の解説

これらの基本パターンを応用することで、より複雑なAIエージェントの実装も可能になります。興味のある方はぜひ次回以降の記事もご覧ください。
