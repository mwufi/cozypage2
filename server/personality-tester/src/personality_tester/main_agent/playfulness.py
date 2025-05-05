
from personality_tester.prompt import PromptBlock


class Playfulness(PromptBlock):
    def __init__(self):
        self.level = "medium"  # options: low, medium, high

    def set_level(self, level: str):
        self.level = level

    def render(self) -> str:
        return f"Playfulness Level: {self.level}"
