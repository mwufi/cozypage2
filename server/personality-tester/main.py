import os
from openai import OpenAI
from personality_tester.prompt import hello

def main():
    # Initialize the OpenAI client
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
    # Make the API call
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say hello!"}
        ]
    )
    
    # Print the response
    print(response.choices[0].message.content)
    print(hello())


if __name__ == "__main__":
    main()
