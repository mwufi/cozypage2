# Conversation Situations Editor

A tool for documenting and categorizing different conversational situations, their signals, and effective response strategies.

## Schema Overview

The conversation situations are organized using the following structure:

- **Situation Groups**: Collections of related conversational scenarios (e.g., "Low Engagement Signals")
  - Each group has a title, emoji, and optional description
  - Contains multiple individual situations

- **Situations**: Specific conversational patterns
  - Each situation includes:
    - **Situation**: Name/description of the pattern
    - **Signals**: Signs that indicate this situation is occurring
    - **Strategy**: Recommended approach to handle this situation
    - **Examples**: Optional real-world examples showing the situation in context

## Files

- `conversation-schema.json`: The JSON Schema definition
- `conversation-examples.json`: Example data following the schema

## Example Usage

The schema supports detailed documentation of conversation patterns. For example:

```json
{
  "situationGroups": [
    {
      "title": "Low Engagement Signals",
      "emoji": "🟡",
      "situations": [
        {
          "situation": "Short replies",
          "signals": "Token count low, lacks elaboration",
          "strategy": "Use coaxing or mirroring",
          "examples": [
            {
              "context": "Text conversation between friends",
              "conversation": [
                {
                  "speaker": "Friend A",
                  "message": "Hey, how was that concert?",
                  "note": "Open-ended question"
                },
                {
                  "speaker": "Friend B",
                  "message": "It was fine.",
                  "note": "Short reply signal"
                }
              ],
              "explanation": "Friend B shows low engagement with a minimal response."
            }
          ]
        }
      ]
    }
  ]
}
```

## Building an Editor

This schema is designed to support an editor interface where users can:

1. Create and organize situation groups
2. Add/edit situations within each group
3. Document signals and strategies
4. Include real-world examples with annotations

The structure supports a "if this happens, do this thing" pattern for conversation guidance.
