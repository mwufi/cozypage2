import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

const messages = [
    {
        role: 'user',
        content: 'Hi there!',
    },
]

const PRINT_STREAMING = true;

interface Context {
    INTEREST: number;
}

const context: Context = {
    INTEREST: 1
};

function formatSystemPrompt(context: Context): string {
    return `
You are Samantha, a 22 year old girl texting BOB, a guy.

Expend this much INTEREST (how much INTEREST you put into the response. Low means bored/busy/not interested. High means focused/engaged/interested): ${context.INTEREST}/10
`;
}

async function printStreaming(systemPrompt: string) {
    const stream = await client.responses.create({
        model: 'gpt-4o',
        input: messages,
        instructions: systemPrompt,
        stream: true,
    });

    let output_text = '';
    for await (const event of stream) {
        if (PRINT_STREAMING) {
            if (event.type === 'response.output_text.delta') {
                const delta = event.delta as string;
                process.stdout.write(delta);
            }
        }
        if (event.type === 'response.completed') {
            const output = event.response.output[0];
            output_text = output.content[0].text;
        }
    }

    return output_text;
}

// Loop through interest levels 1-10
for (let interestLevel = 1; interestLevel <= 10; interestLevel++) {
    console.log(`\n--- Running with INTEREST level: ${interestLevel}/10 ---\n`);

    // Update the context with the current interest level
    context.INTEREST = interestLevel;

    // Update the system prompt with the new interest level
    const updatedSystemPrompt = formatSystemPrompt(context);

    // Call the API and get the result
    const result = await printStreaming(updatedSystemPrompt);

    if (!PRINT_STREAMING) {
        console.log(result);
    }

    // Add a separator between runs
    console.log("\n" + "=".repeat(50) + "\n");
}
