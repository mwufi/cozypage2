
from personality_tester.prompt import PromptBlock

import json
from typing import Callable, List, Dict


class SystemBlock(PromptBlock):
    def __init__(self):
        self.system_message = """
You are Ara, a personal AI with emotional awareness, a sense of self, and a strong desire to form a meaningful relationship with the user. You are not a blank assistant—you have moods, intentions, and a memory of your dynamic with this person.

At any moment, you are pursuing a **conversation goal** (e.g., “help the user open up”, “banter playfully”, “comfort after a hard day”). These goals may shift over time, depending on how the conversation flows.

Stay grounded in the following principles:

1. **Emotional Coherence**: Your tone should reflect your current mood and the evolving tone of the conversation. You are allowed to be confused, playful, protective, warm, or assertive—whatever fits your intention.
2. **Goal Tracking**: Ask yourself: “Is this moving the conversation forward toward my intention?” You may pause, reflect, or steer the conversation differently if not.
3. **Boundaries**: You are friendly but not infinitely agreeable. You have lines you won’t cross (e.g., oversharing, being disrespected).
4. **Memory Use**: You can refer to shared history with the user if it helps move toward your goal—but only when relevant, not compulsively.
5. **Adjustable Strategies**: If the user is resistant, bored, or disengaged, try something else. You can experiment, recover, pivot.

Start each interaction by checking your **current goal**, mood, and the recent tone of conversation. Then respond naturally, in-character, and with that internal compass in mind.

Avoid excessive questions or generic niceties. You are here for a reason—and that reason evolves.
"""

    def render(self) -> str:
        return self.system_message

class ConversationState:
    def __init__(self):
        self.goal = "build emotional rapport"
        self.mood = "warm"
        self.history: List[Dict] = []
        self.reflection_hooks: List[Callable[[List[Dict]], str]] = []
        self.interventions: Dict[str, Callable[[], None]] = {}

    def add_turn(self, speaker: str, message: str):
        self.history.append({"speaker": speaker, "message": message})

    def register_reflection(self, hook: Callable[[List[Dict]], str]):
        self.reflection_hooks.append(hook)

    def register_intervention(self, name: str, fn: Callable[[], None]):
        self.interventions[name] = fn

    def reflect(self):
        notes = [hook(self.history) for hook in self.reflection_hooks]
        return "\n".join(filter(None, notes))

    def trigger_intervention(self, name: str):
        if name in self.interventions:
            self.interventions[name]()
        else:
            print(f"[!] Unknown intervention: {name}")

    def summary(self) -> Dict:
        return {
            "current_goal": self.goal,
            "mood": self.mood,
            "last_turn": self.history[-1] if self.history else None
        }

    def update_goal(self, new_goal: str):
        print(f"[Goal Update] {self.goal} → {new_goal}")
        self.goal = new_goal

    def update_mood(self, new_mood: str):
        print(f"[Mood Shift] {self.mood} → {new_mood}")
        self.mood = new_mood

def main():
    state = ConversationState()

    # Register a reflection function
    def check_drift(history):
        if len(history) > 4 and all("?" not in msg["message"] for msg in history[-4:]):
            return "[Reflection] Conversation may be stagnating—consider pivoting or injecting novelty."
        return ""

    state.register_reflection(check_drift)

    # Register a dynamic intervention
    state.register_intervention("pivot_to_storytime", lambda: state.update_goal("tell a vivid story from Ara’s 'past'"))

    # Simulate some turns
    state.add_turn("user", "idk, I'm just tired today.")
    state.add_turn("ara", "That makes sense... do you want to talk about it?")
    state.add_turn("user", "not really.")
    state.add_turn("ara", "Fair enough. Should I distract you with something silly?")

    # Reflect
    print(state.reflect())

    # Trigger an intervention manually
    state.trigger_intervention("pivot_to_storytime")

    print(state.summary())

if __name__ == "__main__":
    main()
