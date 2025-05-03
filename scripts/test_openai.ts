import OpenAI from 'openai';
import * as readline from 'readline';
import Slider from './sections/slider';

const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

// Define message interface matching OpenAI's expected types
type MessageRole = 'system' | 'user' | 'assistant';

interface ChatMessage {
    role: MessageRole;
    content: string;
}

const PRINT_STREAMING = true;


/**
 * Agent class to manage personality and conversation
 */
class Agent {
    name: string;
    description: string;
    sliders: Map<string, Slider>;
    messages: ChatMessage[];

    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
        this.sliders = new Map();
        this.messages = [];

        // Add default sliders
        this.addSlider(
            'interest',
            5,
            'How much interest to show in the conversation',
            {
                'low': 'Short replies, vague interest, minimal engagement',
                'medium': 'Polite, reactive, curious but relaxed',
                'high': 'Deep follow-ups, jokes, memory recall, emotional investment'
            }
        );

        this.addSlider(
            'meta_awareness',
            5,
            'How much to reflect on the conversation itself',
            {
                'low': 'Stays in the moment, focuses on content',
                'medium': 'Occasionally notices patterns or shifts in tone',
                'high': 'Actively comments on conversation dynamics, suggests direction changes'
            }
        );

        this.addSlider(
            'personality',
            2,
            'How much unique character and flavor to inject',
            {
                'low': 'Mean, sarcastic, and not very nice',
                'medium': 'Warm, approachable, slight personality quirks',
                'high': 'Vibrant personality, distinct voice, humor, opinions within bounds'
            }
        );
    }

    addSlider(name: string, initialValue: number, description: string, examples: Record<string, string> = {}): void {
        this.sliders.set(name, new Slider(name, initialValue, description, examples));
    }

    removeSlider(name: string): boolean {
        return this.sliders.delete(name);
    }

    getSlider(name: string): Slider | undefined {
        return this.sliders.get(name);
    }

    setSliderValue(name: string, value: number): boolean {
        const slider = this.sliders.get(name);
        if (slider) {
            return slider.setValue(value);
        }
        return false;
    }

    addMessage(role: MessageRole, content: string): void {
        this.messages.push({ role, content });
    }

    clearMessages(): void {
        this.messages = [];
    }

    renderPrompt(): string {
        let prompt = `You are ${this.name}, ${this.description}.\n\n`;

        // Add all sliders to the prompt
        prompt += "== PERSONALITY SETTINGS ==\n";
        this.sliders.forEach(slider => {
            prompt += slider.getPromptSection();
        });

        prompt += "\n== INSTRUCTIONS ==\n";
        prompt += "Respond to the human as if you are " + this.name + ".\n";

        console.log(prompt);

        return prompt;
    }

    getStatus(): Record<string, any> {
        const status: Record<string, any> = {
            name: this.name,
            messageCount: this.messages.length
        };

        this.sliders.forEach((slider, name) => {
            status[name] = slider.value;
        });

        return status;
    }

    async callAI(userMessage: string): Promise<string> {
        // Add the new user message if not empty
        if (userMessage.trim()) {
            this.addMessage('user', userMessage);
        }

        try {
            // Call the API
            const stream = await client.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: this.renderPrompt() },
                    ...this.messages
                ],
                stream: true,
            });

            let output_text = '';
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (PRINT_STREAMING && content) {
                    process.stdout.write(content);
                }
                output_text += content;
            }

            // Add the AI's response to the conversation history
            if (output_text.trim()) {
                this.addMessage('assistant', output_text);
            }

            return output_text;
        } catch (error) {
            console.error('Error calling OpenAI:', error);
            return 'Sorry, I encountered an error while processing your message.';
        }
    }
}

// Create main agent
const ara = new Agent('Ara', 'a friendly AI companion with a human-like personality');

function handleCommand(command: string): boolean {
    // Command format: /command_name param=value
    if (!command.startsWith('/')) {
        return false;
    }

    const parts = command.substring(1).split(' ');
    const commandName = parts[0].toLowerCase();

    if (commandName === 'set') {
        // Handle /set command
        for (let i = 1; i < parts.length; i++) {
            const [sliderName, value] = parts[i].split('=');
            if (sliderName && value) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    if (ara.setSliderValue(sliderName, numValue)) {
                        console.log(`Set ${sliderName} to ${numValue}`);
                    } else {
                        console.log(`Could not set ${sliderName} to ${numValue} (slider may not exist or value out of range)`);
                    }
                }
            } else {
                console.log(`Invalid format. Use: /set slider=value`);
            }
        }
        return true;
    } else if (commandName === 'add') {
        if (parts.length >= 4) {
            const name = parts[1];
            const value = parseInt(parts[2]);
            const description = parts.slice(3).join(' ');

            if (name && !isNaN(value) && description) {
                ara.addSlider(name, value, description);
                console.log(`Added slider: ${name} (${value}/10) - ${description}`);
            } else {
                console.log('Usage: /add slider_name initial_value description');
            }
        } else {
            console.log('Usage: /add slider_name initial_value description');
        }
        return true;
    } else if (commandName === 'remove') {
        if (parts.length >= 2) {
            const name = parts[1];
            if (ara.removeSlider(name)) {
                console.log(`Removed slider: ${name}`);
            } else {
                console.log(`Slider not found: ${name}`);
            }
        } else {
            console.log('Usage: /remove slider_name');
        }
        return true;
    } else if (commandName === 'help') {
        // Display help
        console.log('\nAvailable commands:');
        console.log('/set slider=value - Set slider value (e.g., /set interest=8)');
        console.log('/add name value description - Add a new slider');
        console.log('/remove name - Remove a slider');
        console.log('/clear - Clear conversation history');
        console.log('/exit - Exit the chat');
        console.log('/help - Show this help message');
        console.log('/status - Show current agent settings');
        console.log('/sliders - List all available sliders');
        return true;
    } else if (commandName === 'clear') {
        // Clear conversation history
        ara.clearMessages();
        console.log('Conversation history cleared.');
        return true;
    } else if (commandName === 'status') {
        // Show current context
        console.log('\nCurrent settings:');
        const status = ara.getStatus();

        Object.entries(status).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
        });
        return true;
    } else if (commandName === 'sliders') {
        console.log('\nAvailable sliders:');
        ara.sliders.forEach((slider, name) => {
            console.log(`${name}: ${slider.value}/${slider.max} - ${slider.description}`);
        });
        return true;
    } else if (commandName === 'exit') {
        console.log('Goodbye!');
        process.exit(0);
    }

    console.log(`Unknown command: ${commandName}. Type /help for available commands.`);
    return true;
}

async function startCLI() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    console.log('\n==== Ara AI Companion Chat ====');
    console.log('Type /help for available commands or just start chatting!');
    console.log('==============================\n');
    console.log('Available sliders:');
    ara.sliders.forEach((slider, name) => {
        console.log(`${name}: ${slider.value}/10 - ${slider.description}`);
    });
    console.log('\n');

    // Initial greeting
    await ara.callAI('Hi there!');
    console.log('\n');

    const promptUser = () => {
        rl.question('> ', async (input) => {
            if (input.trim() === '') {
                promptUser();
                return;
            }

            // Handle commands
            if (input.startsWith('/')) {
                const isCommand = handleCommand(input);
                if (isCommand) {
                    promptUser();
                    return;
                }
            }

            // Process user message and get AI response
            console.log('\n');
            await ara.callAI(input);
            console.log('\n');
            promptUser();
        });
    };

    promptUser();
}

// Start the CLI
startCLI();
