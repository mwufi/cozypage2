
class PromptBlock:
    def render(self) -> str:
        raise NotImplementedError("Subclasses must implement this method")

    def __str__(self) -> str:
        return self.render()

class String(PromptBlock):
    def __init__(self, string: str):
        self.string = string

    def render(self) -> str:
        return self.string


# system_prompt = String("You are a helpful assistant.")
# personality = Personality("You are a helpful assistant.")
# current_time = CurrentTime()
# current_conversation = CurrentConversation()


# def make_system_prompt():
#     s = f"""
# <system_prompt>
# {system_prompt}
# </system_prompt>

# <current_time>
# {current_time}
# </current_time>

# <current_conversation>
# {current_conversation}
# </current_conversation>

# <personality>
# {personality}
# </personality>
#     """.strip()
#     return s


# def improve_it():
#     global current_conversation
#     current_conversation.add_message("user", "Hello, how are you?")
#     current_conversation.add_message("assistant", "I'm good, thank you!")