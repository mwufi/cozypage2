
from personality_tester.prompt import PromptBlock

class CurrentConversation(PromptBlock):
    def __init__(self):
        self.conversation = []

    def add_message(self, role: str, message: str):
        self.conversation.append(f"{role}: {message}")
    
    def get_recent_history(self, n: int) -> str:
        return "\n".join(self.conversation[-n:])

    def render(self) -> str:
        return "\n".join(self.conversation)