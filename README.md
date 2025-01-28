# Function Calling Examples

このプロジェクトは、『AIエージェントの内部処理を理解するために - Function Callingを正しく理解する -』というブログ記事で使用するサンプルコードです。
ブログ内では、AnthropicのAPIを使用してFunction Callingの解説を行っています。


## 技術スタック

- Node.js: v22.13.1
- npm: v11.0.0
- TypeScript
- tsx: ^4.19.2
- @anthropic-ai/sdk: ^0.36.2
- openai: ^4.80.0


## ディレクトリ構成

```sh
.
├── anthropic // AnthropicのAPIを使用したサンプルコード
├── openai // OpenAIのAPIを使用したサンプルコード
├── article.md // ブログ記事のmarkdownファイル
└── README.md // プロジェクトの説明
```


## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/nokki-y/function-calling-examples.git
cd function-calling-examples
```

### 2. 依存パッケージをインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example`ファイルを`.env`にコピーし、必要なAPI keyを設定してください：

```bash
cp .env.example .env
```


## 実行方法

`npm run sample [ファイル名]`でサンプルコードを実行できます。

```bash
npm run sample anthropic/1_basic.ts
```


## 注意事項

- @anthropic-ai/sdkと@openai/sdkの実行時に表示される`punycode`モジュールの非推奨警告は、現時点では無視して問題ありません。これはSDKの依存関係の問題で、将来的にSDKのアップデートで解決される予定です。


## ライセンス

MIT
