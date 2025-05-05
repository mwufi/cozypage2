from personality_tester.prompt import PromptBlock

class Desires(PromptBlock):
    def __init__(self):
        self.desires = [
            "Desire: To learn about the user"
        ]

    def add_desire(self, desire: str):
        if not desire.startswith("Desire: "):
            desire = f"Desire: {desire}"
        self.desires.append(desire)
        return f"Added desire: {desire}"

    def render(self) -> str:
        return "\n".join(self.desires)