# ECS-Inspired Conversational Agent System

from typing import List, Dict, Any
from personality_tester.ai import client
from loguru import logger

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

def analyze_situation(context: AgentContext, conversation: CurrentConversation):
    """
    Analyze the conversation to determine user interest and adjust personality traits accordingly.
    """
    # Get the last few exchanges to analyze
    recent_history = conversation.get_recent_history(3)  # Assuming this method exists
    
    if not recent_history:
        return  # Not enough conversation history to analyze
    
    # Prepare content for analysis
    analysis_prompt = f"""
    Based on the following conversation, determine if the user seems interested and engaged:
    
    {recent_history}
    
    Rate the user's interest level from 0.0 to 1.0, where:
    - 0.0 means completely disinterested (short replies, trying to end conversation)
    - 0.5 means neutral engagement
    - 1.0 means highly engaged (asking follow-up questions, sharing personal details)
    
    Return only a number between 0.0 and 1.0.
    """
    
    # Call LLM to analyze user interest
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an engagement analyzer. Respond only with a number."},
            {"role": "user", "content": analysis_prompt}
        ],
        temperature=0.3,
        max_tokens=10
    )
    
    # Parse the interest level
    try:
        interest_level = float(response.choices[0].message.content.strip())
        interest_level = max(0.0, min(1.0, interest_level))  # Ensure it's between 0.0 and 1.0
    except (ValueError, AttributeError):
        interest_level = 0.5  # Default to neutral if parsing fails
    
    # Adjust personality traits based on interest level
    if interest_level < 0.4:  # User seems disinterested
        # Increase engagement by making personality more dynamic
        logger.info(f"User is disinterested. Increasing curiosity and playfulness.")
        context.components["curiosity"].set(min(context.components["curiosity"].level + 0.2, 1.0))
        context.components["playfulness"].set("high" if context.components["playfulness"].level != "high" else "medium")
        
        # If user is very disinterested, try vulnerability to deepen connection
        if interest_level < 0.2 and not context.components["vulnerability"].open:
            logger.info(f"User is very disinterested. Opening vulnerability.")
            context.components["vulnerability"].toggle()
            
        # Adjust mood to be more engaging
        if context.components["mood"].mood == "withdrawn":
            logger.info(f"User is withdrawn. Setting mood to curious.")
            context.components["mood"].set("curious")
    
    elif interest_level > 0.7:  # User is highly engaged
        # Maintain or slightly enhance current personality traits
        logger.info(f"User is highly engaged. Maintaining or slightly enhancing current personality traits.")
        context.components["curiosity"].set(min(context.components["curiosity"].level + 0.1, 1.0))
        
        # If attachment is avoidant, gradually shift it
        if context.components["attachment"].style == "avoidant":
            logger.info(f"User is avoidant. Shifting attachment to secure.")
            context.components["attachment"].set("secure")
    
    # For moderate interest (0.4-0.7), make smaller adjustments
    else:
        # Make small adjustments to maintain engagement
        if context.components["curiosity"].level < 0.5:
            logger.info(f"User is moderately engaged. Slightly increasing curiosity.")
            context.components["curiosity"].set(context.components["curiosity"].level + 0.1)

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
        s += ("=== Agent State ===\n")
        s += agent.render()

        s += "\n=== Modulation Instructions ===\n"
        user_input = "Tell me about your childhood."
        for instr in modulate_response(agent, user_input):
            s += f"- {instr}\n"

        return s

    from personality_tester.ai import client
    
    while True:
        system_message = render_system_prompt(agent)
        
        print("\nSystem Message:")
        print(system_message)

        # add conversation history to the system message (but not print it)
        system_message += "\n=== Conversation History ===\n"
        system_message += c.render()

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

        # after every few messages, analyse the situation!
        analyze_situation(agent, c)

        print()