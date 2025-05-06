// Configuration options for the landing page
export type LandingConfig = {
    tagline: string;
    subtagline: string;
};

// Collection of taglines and matching subtaglines
export const taglineOptions: LandingConfig[] = [
    {
        tagline: "The AI that grows with you, not just for you.",
        subtagline: "An assistant that evolves alongside your needs, adapting to your unique patterns and preferences."
    },
    {
        tagline: "Your digital companion with a memory that matters.",
        subtagline: "Ara remembers the details, from small preferences to big projects, so you can focus on what's important."
    },
    {
        tagline: "Your personal AI that recalls what matters to you.",
        subtagline: "Unlike generic tools, Ara builds a memory of your world—your contacts, interests, and the way you work."
    },
    {
        tagline: "Beyond algorithms: an AI that gets you.",
        subtagline: "Not just smart—perceptive. Ara understands the nuances of your needs and responds accordingly."
    },
    {
        tagline: "The AI that adapts to your life, not the other way around.",
        subtagline: "Technology should fit into your world seamlessly. Ara reshapes itself to match your unique workflow."
    },
    {
        tagline: "Finally, AI that feels personal.",
        subtagline: "In a world of generic AI, Ara stands apart by being genuinely yours—tailored to your preferences, voice, and goals."
    },
    {
        tagline: "The assistant that builds a relationship, not just responses.",
        subtagline: "Ara gets better the more you use it, crafting a digital partnership that deepens over time."
    },
    {
        tagline: "Your digital memory, amplified.",
        subtagline: "Ara extends your cognitive capacity, ensuring nothing important falls through the cracks."
    }
];

// Default configuration
export const defaultConfig: LandingConfig = {
    tagline: "The AI that remembers you.",
    subtagline: "Not just smart—yours. Ara grows with you, adapts to your goals, and never forgets what matters."
};

/**
 * Randomly selects a tagline configuration from the available options
 * @returns A configuration object with tagline and subtagline
 */
export function getRandomTagline(): LandingConfig {
    const randomIndex = Math.floor(Math.random() * taglineOptions.length);
    return taglineOptions[randomIndex];
}

/**
 * Load configuration for the landing page
 * In the future, this could incorporate A/B testing, user preferences, etc.
 * @returns The configuration to use for the landing page
 */
export function loadConfiguration(): LandingConfig {
    // For now, simply return a random tagline
    // This is where we would add logic for A/B testing or personalization later

    // Uncomment to always use default config during development
    // return defaultConfig;

    // Return random tagline
    return getRandomTagline();
}
