# ECS-Inspired Conversational Agent System

from typing import List, Dict, Any

from personality_tester.blocks.common.conversation import CurrentConversation

# === Base Block ===
class PromptBlock:
    def render(self) -> str:
        raise NotImplementedError

# === Component Blocks ===
class Mood(PromptBlock):
    def __init__(self):
        self.mood = "curious"
    def set(self, mood: str):
        self.mood = mood
    def render(self):
        return f"Mood: {self.mood}"

class Playfulness(PromptBlock):
    def __init__(self):
        self.level = "medium"
    def set(self, level: str):
        self.level = level
    def render(self):
        return f"Playfulness: {self.level}"

class Attachment(PromptBlock):
    def __init__(self):
        self.style = "secure"
    def set(self, style: str):
        self.style = style
    def render(self):
        return f"Attachment Style: {self.style}"

class VulnerabilityWindow(PromptBlock):
    def __init__(self):
        self.open = False
    def toggle(self):
        self.open = not self.open
    def render(self):
        return f"Vulnerability Window: {'Open' if self.open else 'Closed'}"

class Curiosity(PromptBlock):
    def __init__(self):
        self.level = 0.5  # 0.0 - 1.0
    def set(self, level: float):
        self.level = max(0.0, min(1.0, level))
    def render(self):
        return f"Curiosity Level: {self.level:.2f}"

# === Entity Context ===
class AgentContext:
    def __init__(self):
        self.components: Dict[str, PromptBlock] = {
            "mood": Mood(),
            "playfulness": Playfulness(),
            "attachment": Attachment(),
            "vulnerability": VulnerabilityWindow(),
            "curiosity": Curiosity()
        }

    def render(self) -> str:
        return "\n".join(comp.render() for comp in self.components.values())

# === Modulation System ===
def modulate_response(context: AgentContext, user_input: str) -> List[str]:
    out = []
    mood = context.components["mood"].mood
    if mood == "withdrawn":
        out.append("Keep answers brief. Avoid emotional topics.")
    elif mood == "nostalgic":
        out.append("Reflect on a past event with warmth.")

    playfulness = context.components["playfulness"].level
    if playfulness == "high":
        out.append("Add teasing or playful exaggeration.")

    attach = context.components["attachment"].style
    if attach == "avoidant":
        out.append("Resist deep emotional engagement.")
    elif attach == "anxious":
        out.append("Seek validation subtly in replies.")

    vuln = context.components["vulnerability"].open
    if vuln:
        out.append("Speak openly and share a vulnerable thought.")

    curiosity = context.components["curiosity"].level
    if curiosity > 0.7:
        out.append("Ask a deep, personal question in return.")

    return out

# === Example Usage ===
if __name__ == "__main__":
    c = CurrentConversation()
    agent = AgentContext()
    agent.components["mood"].set("nostalgic")
    agent.components["playfulness"].set("high")
    agent.components["attachment"].set("anxious")
    agent.components["vulnerability"].toggle()
    agent.components["curiosity"].set(0.8)

    def render_system_prompt(agent: AgentContext):
        s = ""
        s += ("=== Agent State ===")
        s += agent.render()

        s += "\n=== Modulation Instructions ==="
        user_input = "Tell me about your childhood."
        for instr in modulate_response(agent, user_input):
            s += f"- {instr}"

        s += "\n=== Conversation History ==="
        s += c.render()

        return s

    from personality_tester.ai import client
    
    while True:
        system_message = render_system_prompt(agent)
        
        print("\nSystem Message:")
        print(system_message)

        # Get user input
        user_input = input("You: ")
        
        # Check if user wants to exit
        if user_input.lower() == "exit":
            break
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_input}
            ]
        )
        
        print(f"Assistant: {response.choices[0].message.content}")
        c.add_message("user", user_input)
        c.add_message("assistant", response.choices[0].message.content)
        
        print()