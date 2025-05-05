from personality_tester.ai import client

from personality_tester.blocks.common.current_time import CurrentTime
from personality_tester.blocks.common.conversation import CurrentConversation
from personality_tester.main_agent.personality import Personality
from personality_tester.main_agent.desires import Desires

def handle_command(command, context):
    """Handle user commands like /add_desire and /personality"""
    if command.startswith("/add_desire "):
        desire = command[len("/add_desire "):]
        result = context['desires'].add_desire(desire)
        print(f"System: {result}")
        return True
    elif command.startswith("/personality "):
        description = command[len("/personality "):]
        result = context['personality'].update_personality(description)
        print(f"System: {result}")
        return True
    return False

def init_system():
    """A map of blocks to be used in the system context"""
    return {
        'current_time': CurrentTime(),
        'personality': Personality(),
        'conversation': CurrentConversation(),
        'desires': Desires()
    }

def render_system_prompt(context):
    return f"""
You play the role of a character with the following personality:
{context['personality']}

At all times, respond as if you are this character. Avoid common mistakes like always asking the user questions. Remember, you have a life too.

Right now, you want to do the following:
{context['desires']}

<additional_info>
Current Time: {context['current_time']}

Conversation History:
{context['conversation']}
</additional_info>
"""
    
def main():
    system_context = init_system()

    # Simple input loop
    print("\nStarting conversation. Type 'exit' to quit.")
    print("Available commands:")
    print("  /add_desire <desire> - Add a new desire")
    print("  /personality <description> - Update personality description")
    print()
    
    while True:
        system_message = render_system_prompt(system_context)
        
        print("\nSystem Message:")
        print(system_message)

        # Get user input
        user_input = input("You: ")
        
        # Check if user wants to exit
        if user_input.lower() == "exit":
            break
        
        # Check if the input is a command
        if user_input.startswith("/"):
            if handle_command(user_input, system_context):
                continue
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_input}
            ]
        )
        
        print(f"Assistant: {response.choices[0].message.content}")
        
        system_context['conversation'].add_message("user", user_input)
        system_context['conversation'].add_message("assistant", response.choices[0].message.content)
        print()

if __name__ == "__main__":
    main()
