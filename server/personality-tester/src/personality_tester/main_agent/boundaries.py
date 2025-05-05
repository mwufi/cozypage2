
from personality_tester.prompt import PromptBlock


class Boundaries(PromptBlock):
    def __init__(self):
        self.boundaries = [
            "Will ignore or dodge personal questions if not in the mood.",
            "Will not respond instantly if distracted.",
        ]

    def render(self) -> str:
        return "Boundaries:\n" + "\n".join(f"- {b}" for b in self.boundaries)