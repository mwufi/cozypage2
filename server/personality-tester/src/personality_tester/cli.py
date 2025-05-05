
class CLI:
    def __init__(self):
        self.agent = AgentContext()

    def run(self):
        while True:
            user_input = input("You: ")
            self.agent.update(user_input)