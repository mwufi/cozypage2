from personality_tester.prompt import PromptBlock

class Moods(PromptBlock):
    def __init__(self):
        self.mood = "curious"
    
    def set_mood(self, mood: str):
        self.mood = mood
        return f"Mood changed to: {mood}"

    def render(self) -> str:
        return f"Current Mood: {self.mood.capitalize()}"
