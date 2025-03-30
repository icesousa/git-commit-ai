import axios from 'axios';

/**
 * The prompt to send to the AI to generate a commit message
 */

function getStyleSpecificPrompt(style: string, language: string = "English"): string {
  const basePrompt = `
You are a helpful AI assistant that generates meaningful and concise git commit messages.
Based on the diff provided, create a commit message following these guidelines:

Follow the Conventional Commits format: <type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore

Scope is optional and should reflect the component being changed

Important: Generate the commit message in ${language} language.`;

  switch (style) {
    case 'Concise - Up to 100 characters':
      return `${basePrompt}

Description should be very concise (max 72 chars), use imperative mood, and not end with a period.
Keep the entire commit message under 100 characters if possible.
Focus only on the most important change.

Diff content:`;

    case 'Normal - Up to 500 characters':
      return `${basePrompt}

Description should be concise (max 72 chars), use imperative mood, and not end with a period.
If needed, add a short paragraph after a blank line explaining the change.
Keep the entire commit message under 500 characters.
Include relevant details from the diff (files changed, key changes).

Diff content:`;

    case 'Detailed - No character limit':
      return `${basePrompt}

Description should be clear (max 100 chars), use imperative mood, and not end with a period.
After a blank line, include a detailed explanation of:
- What was changed and why
- Key implementation details
- Any trade-offs or design decisions
- References to issues or tickets if applicable
Include a comprehensive overview of the files changed and their purpose.

Diff content:`;

    default:
      return COMMIT_PROMPT + `\nImportant: Generate the commit message in ${language} language.`;
  }
}

const COMMIT_PROMPT = `
You are a helpful AI assistant that generates meaningful and concise git commit messages.
Based on the diff provided, create a commit message following these guidelines:

1. Follow the Conventional Commits format: <type>(<scope>): <description>
2. Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
3. Scope is optional and should reflect the component being changed
4. Description should be concise (max 72 chars), use imperative mood, and not end with a period
5. If needed, add a longer description after a blank line
6. Include relevant details from the diff (files changed, key changes)

Diff content:
`;

/**
 * Generates a commit message using the specified AI provider
 * @param provider The AI provider to use (openai, gemini, anthropic)
 * @param apiKey The API key for the provider
 * @param diff The git diff content
 * @param style The style of commit message to generate
 * @param language The language to generate the commit message in
 * @returns Promise with the generated commit message
 */
export async function generateCommitMessage(
  provider: string,
  apiKey: string,
  diff: string,
  style: string,
  language: string = "English",
): Promise<string> {
  switch (provider) {
    case 'deepseek':
      return await generateWithDeepSeek(apiKey, diff, style, language);
    case 'openai':
      return await generateWithOpenAI(apiKey, diff, style, language);
    case 'gemini':
      return await generateWithGemini(apiKey, diff, style, language);
    case 'anthropic':
      return await generateWithAnthropic(apiKey, diff, style, language);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}


/**
 * Generates a commit message using OpenAI API
 */
async function generateWithOpenAI(apiKey: string, diff: string, style: string, language: string = "English"): Promise<string> {
  try {
    const stylePrompt = getStyleSpecificPrompt(style, language);
    
    // Set token limit based on style
    let maxTokens = 200; // Default for Normal style
    if (style === 'Concise - Up to 100 characters') {
      maxTokens = 75; // Fewer tokens for concise style
    } else if (style === 'Detailed - No character limit') {
      maxTokens = 500; // More tokens for detailed style
    }
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates concise and meaningful git commit messages.'
          },
          {
            role: 'user',
            content: `${stylePrompt}\n${diff}`
          }
        ],
        temperature: 0.5,
        max_tokens: maxTokens
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error: any) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
  }
}


/**
 * Generates a commit message using Google's Gemini API
 */
async function generateWithGemini(apiKey: string, diff: string, style: string, language: string = "English"): Promise<string> {
  const stylePrompt = getStyleSpecificPrompt(style, language);
  
  // Set token limit based on style
  let maxTokens = 200; // Default for Normal style
  if (style === 'Concise - Up to 100 characters') {
    maxTokens = 75; // Fewer tokens for concise style
  } else if (style === 'Detailed - No character limit') {
    maxTokens = 500; // More tokens for detailed style
  }
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `${stylePrompt}\n${diff}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: maxTokens
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.candidates[0].content.parts[0].text.trim();
  } catch (error: any) {
    console.error('Gemini API error:', error.response?.data || error.message);
    throw new Error(`Gemini API error: ${error.response?.data?.error?.message || error.message}`);
  }
}


/**
 * Generates a commit message using DeepSeek's API
 */
async function generateWithDeepSeek(apiKey: string, diff: string, style: string, language: string = "English"): Promise<string> {
  const stylePrompt = getStyleSpecificPrompt(style, language);
  
  // Set token limit based on style
  let maxTokens = 200; // Default for Normal style
  if (style === 'Concise - Up to 100 characters') {
    maxTokens = 75; // Fewer tokens for concise style
  } else if (style === 'Detailed - No character limit') {
    maxTokens = 500; // More tokens for detailed style
  }
  
  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: stylePrompt
          },
          {
            role: "user",
            content: diff
          }
        ],
        temperature: 0.5,
        max_tokens: maxTokens
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error: any) {
    console.error("DeepSeek API error:", error.response?.data || error.message);
    throw new Error(`DeepSeek API error: ${error.response?.data?.error?.message || error.message}`);
  }
}


/**
 * Generates a commit message using Anthropic's Claude API
 */
async function generateWithAnthropic(apiKey: string, diff: string, style: string, language: string = "English"): Promise<string> {
  const stylePrompt = getStyleSpecificPrompt(style, language);
  
  // Set token limit based on style
  let maxTokens = 200; // Default for Normal style
  if (style === 'Concise - Up to 100 characters') {
    maxTokens = 75; // Fewer tokens for concise style
  } else if (style === 'Detailed - No character limit') {
    maxTokens = 500; // More tokens for detailed style
  }
  
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-sonnet-20240229',
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: `${stylePrompt}\n${diff}`
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    return response.data.content[0].text.trim();
  } catch (error: any) {
    console.error('Anthropic API error:', error.response?.data || error.message);
    throw new Error(`Anthropic API error: ${error.response?.data?.error || error.message}`);
  }
}
