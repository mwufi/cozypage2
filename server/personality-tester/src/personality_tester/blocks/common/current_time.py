
from datetime import datetime
from personality_tester.prompt import PromptBlock


class CurrentTime(PromptBlock):
    def render(self) -> str:
        return f"The current time is {datetime.now()}"
