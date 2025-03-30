import * as vscode from "vscode";
import { getGitStagedDiff } from "./gitUtils";
import { generateCommitMessage } from "./aiProviders";
///TODO : TESTAR SE O ESTILO ESTA FUNCIONANDO
export function activate(context: vscode.ExtensionContext) {
  console.log("Complete Commit AI extension is now active");

  const generateCommitMessageCommand = vscode.commands.registerCommand(
    "complete-commit-ai.generateCommitMessage",
    async () => {
      // Get the git extension
      const gitExtension = vscode.extensions.getExtension("vscode.git")?.exports;
      if (!gitExtension) {
        vscode.window.showErrorMessage("Git extension not found");
        return;
      }

      const api = gitExtension.getAPI(1);
      const repositories = api.repositories;
      if (!repositories.length) {
        vscode.window.showErrorMessage("No repositories found");
        return;
      }

      const repo = repositories[0];

      // Check if there are staged changes
      if (repo.state.indexChanges.length === 0) {
        vscode.window.showWarningMessage(
          "No staged changes found. Stage your changes first."
        );
        return;
      }

      // Ask user if they want to generate a commit message
      const response = await vscode.window.showInformationMessage(
        "Want to generate a commit message?",
        "Yes",
        "No"
      );

      if (response !== "Yes") {
        return;
      }

      try {
        // Get the diff of staged changes
        const diff = await getGitStagedDiff(repo.rootUri.fsPath);

        // Check which provider is configured
        const config = vscode.workspace.getConfiguration("complete-commit-ai");
        let provider = config.get<string>("apiProvider", "openai");
        const style = config.get<string>("apiStyle", "Normal - Up to 500 characters");
        // Get the selected language
        const commitLanguage = config.get<string>("commitLanguage", "English");
        
        // Declare apiKey variable here, before usage in conditionals
        let apiKey = "";
        
        // Check if the diff is too large (15KB is a reasonable threshold)
        const LARGE_DIFF_THRESHOLD = 15 * 1024; // 15KB
        const EXPENSIVE_PROVIDERS = ["openai", "anthropic"];
        
        if (diff.length > LARGE_DIFF_THRESHOLD && EXPENSIVE_PROVIDERS.includes(provider)) {
          const warningMessage = `This commit contains a large amount of changes (${(diff.length/1024).toFixed(1)}KB), which may be expensive to process with ${provider.toUpperCase()}.`;
          const userChoice = await vscode.window.showWarningMessage(
            warningMessage,
            "Continue Anyway",
            "Switch to DeepSeek",
            "Switch to Gemini",
            "Cancel"
          );
          
          if (userChoice === "Cancel") {
            return;
          } else if (userChoice === "Switch to DeepSeek") {
            provider = "deepseek";
            // Check if DeepSeek API key is configured
            const deepseekApiKey = config.get<string>("deepseekApiKey", "");
            if (!deepseekApiKey) {
              await vscode.window.showWarningMessage(
                `You have no API key configured for DeepSeek. Please add one in the extension settings.`,
                "OK"
              );
              // Revert to original provider
              provider = config.get<string>("apiProvider", "openai");
            } else {
              apiKey = deepseekApiKey;
            }
          } else if (userChoice === "Switch to Gemini") {
            provider = "gemini";
            // Check if Gemini API key is configured
            const geminiApiKey = config.get<string>("geminiApiKey", "");
            if (!geminiApiKey) {
              await vscode.window.showWarningMessage(
                `You have no API key configured for Gemini. Please add one in the extension settings.`,
                "OK"
              );
              // Revert to original provider
              provider = config.get<string>("apiProvider", "openai");
            } else {
              apiKey = geminiApiKey;
            }
          }
        }
        
        // Check if API key is set for the selected provider
        const apiKeyConfig = `${provider}ApiKey`;
        // Update apiKey only if we haven't already set it in the conditional above
        if (!apiKey) {
          apiKey = config.get<string>(apiKeyConfig, "");
        }
        
        if (!apiKey) {
          vscode.window.showErrorMessage(
            `Please set your ${provider} API key in the extension settings.`
          );
          return; // Exit early if no API key is found
        }

        // Show loading message only after validating API key
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Generating commit message...",
            cancellable: false,
          },
          async (progress) => {
            try {
              // Generate commit message
              const commitMessage = await generateCommitMessage(
                provider,
                apiKey,
                diff,
                style,
                commitLanguage
              );

              // Set the commit message in the input box
              repo.inputBox.value = commitMessage;

              vscode.window.showInformationMessage(
                `Commit message generated!`
              );
            } catch (error: any) {
              vscode.window.showErrorMessage(`Error generating commit message: ${error.message}`);
            }
          }
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
      }
    }
  );

  context.subscriptions.push(generateCommitMessageCommand);
}

export function deactivate() { }
