/**
 * Represents a personality slider that can be adjusted
 */
class Slider {
    name: string;
    value: number;
    min: number;
    max: number;
    description: string;
    examples: Record<string, string>;

    constructor(
        name: string,
        initialValue: number,
        description: string,
        examples: Record<string, string> = {},
        min = 1,
        max = 10
    ) {
        this.name = name;
        this.value = initialValue;
        this.min = min;
        this.max = max;
        this.description = description;
        this.examples = examples;
    }

    setValue(value: number): boolean {
        if (value >= this.min && value <= this.max) {
            this.value = value;
            return true;
        }
        return false;
    }

    getDescription(): string {
        return `${this.description} (${this.value}/${this.max})`;
    }

    getPromptSection(): string {
        const lowKey = 'low';
        const mediumKey = 'medium';
        const highKey = 'high';

        // Determine which range the current value falls into
        const isLow = this.value <= Math.floor(this.max * 0.3);
        const isMedium = this.value > Math.floor(this.max * 0.3) && this.value <= Math.floor(this.max * 0.7);
        const isHigh = this.value > Math.floor(this.max * 0.7);

        // Create the section with only the relevant example
        let section = `\n${this.name.toUpperCase()}: ${this.value}/${this.max} - ${this.description}\n`;

        if (isLow && this.examples[lowKey]) {
            section += `(${this.examples[lowKey]})\n`;
        } else if (isMedium && this.examples[mediumKey]) {
            section += `(${this.examples[mediumKey]})\n`;
        } else if (isHigh && this.examples[highKey]) {
            section += `(${this.examples[highKey]})\n`;
        }

        return section;
    }
}

export default Slider;