import { test, expect, describe } from "bun:test";
import Slider from '../sections/slider';

describe('Slider', () => {
    test('should create with default values', () => {
        const slider = new Slider('test', 5, 'test description');

        expect(slider.name).toBe('test');
        expect(slider.value).toBe(5);
        expect(slider.min).toBe(1);
        expect(slider.max).toBe(10);
        expect(slider.description).toBe('test description');
        expect(slider.examples).toEqual({});
    });

    test('should create with custom min and max', () => {
        const slider = new Slider('test', 50, 'test description', {}, 0, 100);

        expect(slider.min).toBe(0);
        expect(slider.max).toBe(100);
        expect(slider.value).toBe(50);
    });

    test('should create with examples', () => {
        const examples = {
            'low': 'This is low',
            'medium': 'This is medium',
            'high': 'This is high'
        };

        const slider = new Slider('test', 5, 'test description', examples);

        expect(slider.examples).toEqual(examples);
    });

    test('setValue should update value when within range', () => {
        const slider = new Slider('test', 5, 'test description');

        const result = slider.setValue(8);

        expect(result).toBe(true);
        expect(slider.value).toBe(8);
    });

    test('setValue should reject values below min', () => {
        const slider = new Slider('test', 5, 'test description');

        const result = slider.setValue(0);

        expect(result).toBe(false);
        expect(slider.value).toBe(5); // unchanged
    });

    test('setValue should reject values above max', () => {
        const slider = new Slider('test', 5, 'test description');

        const result = slider.setValue(11);

        expect(result).toBe(false);
        expect(slider.value).toBe(5); // unchanged
    });

    test('getDescription should return formatted description', () => {
        const slider = new Slider('test', 7, 'test description');

        const description = slider.getDescription();

        expect(description).toBe('test description (7/10)');
    });

    test('getPromptSection should format prompt with all examples', () => {
        const examples = {
            'low': 'This is low',
            'medium': 'This is medium',
            'high': 'This is high'
        };

        const slider = new Slider('test', 5, 'test description', examples);

        const promptSection = slider.getPromptSection();

        expect(promptSection).toContain('TEST: 5/10 - test description');
        expect(promptSection).toContain('🔈 Low (1-3): This is low');
        expect(promptSection).toContain('🔊 Medium (4-7): This is medium');
        expect(promptSection).toContain('📢 High (8-10): This is high');
    });

    test('getPromptSection should handle missing examples', () => {
        const examples = {
            'low': 'This is low',
            // medium missing
            'high': 'This is high'
        };

        const slider = new Slider('test', 5, 'test description', examples);

        const promptSection = slider.getPromptSection();

        expect(promptSection).toContain('TEST: 5/10 - test description');
        expect(promptSection).toContain('🔈 Low (1-3): This is low');
        expect(promptSection).not.toContain('Medium');
        expect(promptSection).toContain('📢 High (8-10): This is high');
    });

    test('should handle custom ranges in examples', () => {
        const examples = {
            'low': 'Very little',
            'medium': 'Moderate amount',
            'high': 'Maximum effort'
        };

        const slider = new Slider('custom', 15, 'test with custom range', examples, 0, 20);

        const promptSection = slider.getPromptSection();

        expect(promptSection).toContain('CUSTOM: 15/20 - test with custom range');
        expect(promptSection).toContain('🔈 Low (0-6): Very little');
        expect(promptSection).toContain('🔊 Medium (7-14): Moderate amount');
        expect(promptSection).toContain('📢 High (15-20): Maximum effort');
    });
}); 