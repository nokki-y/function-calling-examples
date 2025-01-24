# AIエージェントの内部処理を理解するために - Function Callingを正しく理解する -

> この記事で紹介するサンプルコードは、[GitHub](https://github.com/nokki-y/function-calling-examples)で公開しています。
> なお、記事内ではAnthropicのFunction Callingを中心に解説しますが、サンプルコードリポジトリにはOpenAI APIを使用した同様の実装パターンも含まれています。


## 1. はじめに

最近、様々なAIエージェントが登場し話題になっていますが、その中核を担う技術の一つが「Function Calling」です。

本記事では、AIエージェントの内部動作、特にAnthropicのFunction Calling（Tool Use）に焦点を当て、その仕組みと実装方法について解説します。

### AIエージェントとは

まず、AIエージェントとは、ユーザーの指示に基づいて自律的にタスクを実行するAIシステムです。これらは単なる質問応答だけでなく、外部APIの呼び出し、データの処理、さらには複雑な意思決定まで行うことができます。

### Function Callingの重要性

Function Callingは、AIモデルが外部の関数やAPIを呼び出すための機能です。これにより、AIは：

- テキスト生成以外の具体的なアクション実行
- 外部システムとの連携
- 構造化されたデータの処理

などが可能になります。

### 本記事の目的

この記事では、以下の内容を目指します：

- Function Callingの基本概念の理解
- AnthropicのFunction Calling実装方法の習得
- 実践的な実装パターンの紹介


## 2. Function Callingの基礎

### Function Callingとは何か

Function Callingは、AIモデルが外部の関数を呼び出すための仕組みです。これにより、AIは：

- 外部APIとの連携
- データベースの操作
- ファイル操作

などの具体的なアクションを実行できます。

### AnthropicとOpenAIのFunction Calling比較

今回は主題としては取り上げませんが、OpenAIのFunction Callingも同様の機能を提供しているので、補足情報として比較してみます。

|  | Anthropic | OpenAI |
|------|-----------|--------|
| 呼び方 | Tool Use | Function Calling |
| スキーマ定義 | JSON Schema | JSON Schema |
| 思考プロセス | Chain of Thoughtサポート | 基本的な実行のみ |


## 3. Anthropic APIの基本

### APIの基本的な使い方

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function main() {
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

```typescript
const tools = [{
  name: "get_weather",
  description: "指定された場所の天気情報を取得します",
  input_schema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "場所（例：東京）",
      },
    },
    required: ["location"],
  },
}];

const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1000,
  messages: [{
    role: "user",
    content: "東京の天気は？",
  }],
  tools,
});
```

#### 実行結果

ツールを使用する例：

```json
{
  "id": "msg_0192ps4qaRwKUnjANt24TFH5",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet-20241022",
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_01ELne45XoiWhqw2sPEVLb41",
      "name": "get_weather",
      "input": {
        "location": "東京"
      }
    }
  ],
  "stop_reason": "tool_use",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 339,
    "output_tokens": 54
  }
}
```

ツールを使用しない例：

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
{
  "id": "msg_01BhJc6d3KadX9ezw58EjUMH",
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
  "usage": {
    "input_tokens": 339,
    "output_tokens": 89
  }
}
```

この基本パターンの実行結果から、以下のことが分かります：

- AIモデルは質問の内容に応じて、ツールの使用が必要かどうかを判断します
- ツールを使用する場合：
  - 質問から必要な情報（場所：東京）を適切に抽出しています
  - `stop_reason: "tool_use"`は、AIモデルがツールの使用を決定したことを示しています
  - `input`オブジェクトには、スキーマに従って適切なパラメータが設定されています
- ツールを使用しない場合：
  - 必要な情報が不足している場合は、ユーザーに追加情報を求めます
  - `stop_reason: "end_turn"`は、AIモデルが会話を継続することを示しています
  - `type: "text"`で直接テキストを返却しています

### 2. シーケンシャル実行パターン

複数のツールを順番に実行するパターンです。前のツールの結果を次のツールの入力として使用します。

```typescript
const tools = [{
  name: "get_location",
  description: "ユーザーの現在位置を取得",
  input_schema: {
    type: "object",
    properties: {},
  },
}, {
  name: "get_weather",
  description: "指定された場所の天気情報を取得",
  input_schema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "場所",
      },
    },
    required: ["location"],
  },
}];

// ツール実行の連鎖
const location = await executeGetLocation();
const weather = await executeGetWeather(location);
```

#### 実行結果

```json
{
  "id": "msg_01LNGy7BpJHfzNeBiaxBi27y",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet-20241022",
  "content": [
    {
      "type": "text",
      "text": "はい、わかりました。あなたの地域の天気情報を取得するために、以下のように天気取得ツールを呼び出します。"
    },
    {
      "type": "tool_use",
      "id": "toolu_01N8nwhoMe9zu9JxAUV8Wdv5",
      "name": "get_weather",
      "input": {
        "location": "東京"
      }
    }
  ],
  "stop_reason": "tool_use",
  "usage": {
    "input_tokens": 415,
    "output_tokens": 98
  }
}
```

シーケンシャル実行パターンの実行結果から、以下のことが分かります：

- AIモデルは最初に説明文（text）を生成し、その後ツールを呼び出しています
- 複数のツールが定義されていても、必要なツールのみを選択して実行しています
- 前のツールの結果を考慮して、次のツールの入力を決定しています

### 3. JSON特化パターン

スキーマベースの型定義と検証機能を持つJSONデータの生成に特化したパターンです。

```typescript
const tools = [{
  name: "format_user_data",
  description: "ユーザーデータをJSON形式に整形",
  input_schema: {
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
    },
    required: ["name", "age"],
  },
}];
```

#### 実行結果

```json
{
  "id": "msg_01W32aoSJYoPYDYaini5bsnq",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet-20241022",
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_014Gi98iAmernhxnEkhQvV6c",
      "name": "format_user_data",
      "input": {
        "name": "山田太郎",
        "age": 30,
        "email": "yamada@example.com"
      }
    }
  ],
  "stop_reason": "tool_use",
  "usage": {
    "input_tokens": 414,
    "output_tokens": 98
  }
}
```

JSON特化パターンの実行結果から、以下のことが分かります：

- 非構造化テキストから必要な情報を抽出し、構造化データとして整形しています
- スキーマで定義された必須フィールド（name, age）に加え、オプショナルフィールド（email）も適切に処理しています
- 各フィールドの型（文字列、数値）が正しく設定されています

### 4. Chain of Thoughtパターン

システムプロンプトを使用して思考プロセスを制御し、より適切なツール選択を行うパターンです。

```typescript
const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1000,
  messages: [{
    role: "user",
    content: "天気を教えて",
  }],
  tools,
  system: `
    ツールを使用する前に、以下のステップで考えてください：
    1. 必要な情報は何か
    2. どのツールを使うべきか
    3. パラメータは適切か
  `,
});
```

#### 実行結果

```json
{
  "id": "msg_01LNGy7BpJHfzNeBiaxBi27y",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet-20241022",
  "content": [
    {
      "type": "text",
      "text": "はい、わかりました。あなたの地域の天気情報を取得するために、以下のように天気取得ツールを呼び出します。"
    },
    {
      "type": "tool_use",
      "id": "toolu_01N8nwhoMe9zu9JxAUV8Wdv5",
      "name": "get_weather",
      "input": {
        "location": "東京"
      }
    }
  ],
  "stop_reason": "tool_use",
  "usage": {
    "input_tokens": 415,
    "output_tokens": 98
  }
}
```

Chain of Thoughtパターンの実行結果から、以下のことが分かります：

- システムプロンプトの指示に従って、AIモデルは思考プロセスを説明文として出力しています
- 必要な情報（場所）が不足している場合でも、デフォルト値（東京）を使用して処理を進めています
- ツールの選択理由が説明文に含まれており、判断プロセスが透明になっています

### 5. エラーハンドリングパターン

ツールの実行時のエラーを適切に処理し、フォールバックプロセスを実装するパターンです。

```typescript
try {
  const result = await executeTool(toolName, params);
  if (!result.success) {
    // エラー時の代替処理
    const fallbackResult = await executeFallbackTool();
    return fallbackResult;
  }
  return result;
} catch (error) {
  console.error("ツール実行エラー:", error);
  // ユーザーへのフィードバック
  return {
    error: true,
    message: "ツールの実行に失敗しました",
  };
}
```

### 6. 並列実行制御パターン

複数のツールを並列に実行する際の制御を行うパターンです。実行順序の制御やリソースの競合を防ぐための仕組みを実装します。

```typescript
const tools = [{
  name: "get_data",
  description: "データ取得（並列実行不可）",
  input_schema: {
    type: "object",
    properties: {
      id: {
        type: "string",
      },
    },
    required: ["id"],
  },
}];

// 実行制御
let isExecuting = false;
async function executeWithControl(tool, params) {
  if (isExecuting) {
    throw new Error("別の処理が実行中です");
  }
  isExecuting = true;
  try {
    return await executeTool(tool, params);
  } finally {
    isExecuting = false;
  }
}
```

#### 実行結果

```json
{
  "id": "msg_01BhJc6d3KadX9ezw58EjUMH",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet-20241022",
  "content": [
    {
      "type": "text",
      "text": "はい、わかりました。以下のようにget_dataツールを呼び出してデータを取得します。"
    },
    {
      "type": "tool_use",
      "id": "toolu_017Wv3nKDVzWoqu36L9PkaYp",
      "name": "get_data",
      "input": {
        "id": "1"
      }
    }
  ],
  "stop_reason": "tool_use",
  "usage": {
    "input_tokens": 319,
    "output_tokens": 85
  }
}
```

並列実行制御パターンの実行結果から、以下のことが分かります：

- AIモデルは実行前に説明文を生成し、処理の意図を明確にしています
- 並列実行可能な場合でも、リソースの競合を避けるため1つずつ実行されています
- 各リクエストに一意のIDが割り当てられ、実行の追跡が可能になっています


## 5. ベストプラクティス

### 効果的なツール説明の書き方

```typescript
const tool = {
  name: "get_weather",
  description: `
    指定された場所の現在の天気情報を取得します。
    - 使用時期：ユーザーが特定の場所の天気を知りたい場合
    - 返却データ：気温、天気、湿度
    - 制限事項：過去の天気データは取得できません
  `,
  input_schema: {
    // ...
  },
};
```

### パラメータ設計のコツ

1. **必須パラメータの最小化**
   - 本当に必要なパラメータのみrequiredに
   - オプショナルパラメータの適切な初期値設定

2. **明確な型定義**
   - 曖昧な型定義を避ける
   - 適切な制約の設定

3. **わかりやすい説明**
   - 各パラメータの役割を明確に
   - 具体例の提示

### エッジケースの処理

1. **入力値の検証**
   - 範囲チェック
   - フォーマットチェック

2. **エラー時の代替処理**
   - フォールバックの用意
   - グレースフルデグラデーション

3. **タイムアウト処理**
   - 適切なタイムアウト設定
   - リトライ戦略


## 6. まとめ

### Function Callingの可能性

Function Callingは、AIエージェントの能力を大きく拡張する技術です。本記事で紹介した実装パターンを活用することで：

- より堅牢なAIシステムの構築
- 複雑なタスクの自動化
- 外部システムとの効果的な連携
が可能になります。

### 今後の展望

1. **さらなる機能拡張**
   - より柔軟なツール定義
   - 高度な実行制御

2. **新しいユースケース**
   - ビジネスプロセスの自動化
   - 高度な意思決定支援

3. **標準化の進展**
   - 共通インターフェースの確立
   - ベストプラクティスの確立

Function Callingは、AIエージェントの重要な構成要素として、今後さらなる発展が期待されます。本記事で紹介した実装パターンを参考に、より良いAIシステムの構築にチャレンジしてください。


## 7. 実装パターンの応用例

### 複数パターンの組み合わせ

実際のアプリケーションでは、複数のパターンを組み合わせて使用することが一般的です。

```typescript
// Chain of Thoughtとエラーハンドリングの組み合わせ
const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1000,
  messages: [{
    role: "user",
    content: "天気を教えて",
  }],
  tools,
  system: `
    ツールを使用する前に、以下のステップで考えてください：
    1. 必要な情報は何か
    2. どのツールを使うべきか
    3. パラメータは適切か
    4. エラーが発生した場合の代替案は？
  `,
});

try {
  const result = await executeTool(message);
} catch (error) {
  // フォールバック処理
  const fallback = await handleError(error);
}
```

### 実践的なユースケース

1. **外部APIとの連携**

   ```typescript
   const tools = [{
     name: "call_external_api",
     description: "外部APIを呼び出します",
     input_schema: {
       type: "object",
       properties: {
         endpoint: { type: "string" },
         method: { type: "string" },
         params: { type: "object" },
       },
       required: ["endpoint"],
     },
   }];
   ```

2. **データベース操作**

   ```typescript
   const tools = [{
     name: "query_database",
     description: "データベースに対してクエリを実行します",
     input_schema: {
       type: "object",
       properties: {
         query: { type: "string" },
         params: { type: "array" },
       },
       required: ["query"],
     },
   }];
   ```

3. **ファイル操作**

   ```typescript
   const tools = [{
     name: "file_operation",
     description: "ファイルの読み書きを行います",
     input_schema: {
       type: "object",
       properties: {
         path: { type: "string" },
         operation: { type: "string" },
         content: { type: "string" },
       },
       required: ["path", "operation"],
     },
   }];
   ```

### パフォーマンス最適化

1. **キャッシュの活用**

   ```typescript
   const cache = new Map();
   
   async function executeWithCache(tool, params) {
     const cacheKey = `${tool.name}-${JSON.stringify(params)}`;
     if (cache.has(cacheKey)) {
       return cache.get(cacheKey);
     }
     
     const result = await executeTool(tool, params);
     cache.set(cacheKey, result);
     return result;
   }
   ```

2. **バッチ処理**

   ```typescript
   async function executeBatch(tools, paramsList) {
     const batchSize = 5;
     const results = [];
     
     for (let i = 0; i < paramsList.length; i += batchSize) {
       const batch = paramsList.slice(i, i + batchSize);
       const batchResults = await Promise.all(
         batch.map(params => executeTool(tools[0], params))
       );
       results.push(...batchResults);
     }
     
     return results;
   }
   ```

これらの応用例は、実際のプロジェクトでFunction Callingを効果的に活用するためのベースとなります。状況に応じて適切なパターンを選択し、必要に応じて組み合わせることで、より堅牢なAIシステムを構築できます。
