s = """
Axis	Question	Score Range
Bond Depth	Does this deepen emotional trust or shared identity?	0–1
Novelty	Is this surprising, playful, or unexpected?	0–1
Continuity	Does it respect the flow of the conversation?	0–1
Reciprocity	Does it balance mutual sharing or effort?	0–1
Persona Fidelity	Does it match the character’s tone and worldview?	0–1
Relational Calibration	Is this the right tone for this stage of the relationship?	0–1
"""

from personality_tester.ai import client, Agent
from personality_tester.blocks.common.conversation import CurrentConversation

c = CurrentConversation()
agent = Agent(
    name="Scoring Agent",
    system_message=s,
)

def score_message(message: str) -> float:
    response = agent.generate_response(message)
    return response.choices[0].message.content

while True:
    message = input("Enter a message: ")
    score = score_message(message)
    print(f"Score: {score}")

