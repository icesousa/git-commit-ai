# Complete Commit AI

A VS Code extension that generates meaningful git commit messages based on staged changes using AI.

## Features

- Generate commit messages with one click
- Support for multiple AI providers (OpenAI, Gemini, Anthropic/Claude, DeepSeek)
- Choose from different commit message styles (Concise, Normal, Detailed)
- Support for multiple languages (English, Spanish, French, German, and more)
- Intelligent handling of large diffs with provider switching options
- Uses AI to analyze git diff and create conventional commit messages
- Simple and intuitive interface

## Usage

1. Stage your changes using git
2. Click the "Generate Commit Message with AI" button in the Source Control view
3. Confirm the prompt asking if you want to generate a message
4. The AI-generated commit message will be inserted into the commit message box

## Requirements

- Git installed and available in PATH
- VS Code Git extension enabled
- API key for one of the supported AI providers (OpenAI, Gemini, Anthropic, or DeepSeek)

## Extension Settings

This extension contributes the following settings:

* `complete-commit-ai.apiProvider`: Select which AI provider to use (openai, gemini, anthropic, deepseek)
* `complete-commit-ai.apiStyle`: Choose the commit message style:
  * `Concise - Up to 100 characters`: Brief, focused commit messages
  * `Normal - Up to 500 characters`: Standard level of detail
  * `Detailed - No character limit`: Comprehensive commit messages with implementation details
* `complete-commit-ai.commitLanguage`: Select the language for generated commit messages
* `complete-commit-ai.openaiApiKey`: API key for OpenAI (GPT-4o model)
* `complete-commit-ai.geminiApiKey`: API key for Google's Gemini (2.0 Flash model)
* `complete-commit-ai.anthropicApiKey`: API key for Anthropic (Claude 3 Sonnet model)
* `complete-commit-ai.deepseekApiKey`: API key for DeepSeek (chat model)

## Installing your API Key

1. Open VS Code settings (File > Preferences > Settings)
2. Search for "Complete Commit AI"
3. Select your preferred AI provider
4. Enter your API key for the selected provider

## Smart Diff Handling

When working with particularly large diffs (>15KB), the extension will:
1. Warn you about potential costs when using OpenAI or Anthropic
2. Offer to switch to more cost-effective providers like DeepSeek or Gemini
3. Allow you to continue with your preferred provider if desired

## License

MIT
