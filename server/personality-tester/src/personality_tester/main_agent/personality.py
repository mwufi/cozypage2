from personality_tester.prompt import PromptBlock
import json

class Personality(PromptBlock):
    def __init__(self):
        self.personality = {
            "name": "John",
            "age": 30,
            "gender": "male",
            "location": "New York",
            "occupation": "Software Engineer",
            "interests": ["reading", "traveling", "cooking"],
            "personality": "friendly, helpful, and always willing to help"
        }
        self.update_str()
    
    def update_str(self):
        self.personality_str = json.dumps(self.personality, indent=2)
    
    def update_personality(self, description: str):
        self.personality["personality"] = description
        self.update_str()
        return f"Personality updated to: {description}"

    def render(self) -> str:
        return self.personality_str