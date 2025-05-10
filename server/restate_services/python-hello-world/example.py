import uuid
import restate
from datetime import timedelta
from restate import Service, Context
from utils import send_notification, send_reminder
from pydantic import BaseModel

# --- Imports for Todo completion ---
from dotenv import load_dotenv
from sqlalchemy.future import select
from shared.database_config.database import AsyncSessionLocal, engine, Base # Using AsyncSessionLocal directly
from shared.database_models.models import Todo
# --- End Todo completion imports ---

# Load environment variables (e.g., DATABASE_URL if not set by Docker)
load_dotenv()


# You can also just use a typed dict, without Pydantic
class GreetingRequest(BaseModel):
    name: str


class Greeting(BaseModel):
    message: str

# --- Pydantic model for completeTodo endpoint ---
class CompleteTodoRequest(BaseModel):
    todoId: int

greeter = Service("Greeter")


@greeter.handler()
async def greet(ctx: Context, req: GreetingRequest) -> Greeting:
    # Durably execute a set of steps; resilient against failures
    greeting_id = await ctx.run("generate UUID", lambda: str(uuid.uuid4()))
    await ctx.run("send notification", lambda: send_notification(greeting_id, req.name))
    await ctx.sleep(timedelta(seconds=1))
    await ctx.run("send reminder", lambda: send_reminder(greeting_id))

    # Respond to caller
    return Greeting(message=f"You said hi to {req.name}!")

def something_else(id: str):
    return f"We got: {id}"

@greeter.handler()
async def nofail(ctx: Context, req: GreetingRequest) -> Greeting:
    response = await ctx.run("something else", lambda: something_else(req.name))
    return Greeting(message=f"You said hi to {req.name}! {response}")

# --- Endpoint to mark a todo as complete --- 
@greeter.handler()
async def completeTodo(ctx: Context, request: CompleteTodoRequest) -> Greeting: # Returning a simple Greeting for now
    todo_id = request.todoId
    print(f"Restate service: Received request to complete todoId: {todo_id}")

    async with AsyncSessionLocal() as session:
        async with session.begin(): # Begin a transaction
            try:
                # Fetch the todo
                todo_query = select(Todo).where(Todo.id == todo_id)
                result = await session.execute(todo_query)
                db_todo = result.scalar_one_or_none()

                if db_todo:
                    if not db_todo.completed:
                        db_todo.completed = True
                        # session.add(db_todo) # Not strictly necessary if object is tracked and modified
                        await session.commit() # Commit the change
                        message = f"Todo {todo_id} marked as completed."
                        print(message)
                    else:
                        message = f"Todo {todo_id} was already completed."
                        print(message)
                else:
                    message = f"Todo {todo_id} not found."
                    print(message)
                    # Optionally, raise an error or return a different response code via Restate context
                    # For now, just returning a message.
            except Exception as e:
                await session.rollback()
                message = f"Error completing todo {todo_id}: {e}"
                print(message)
                # Consider raising an exception that Restate can handle as a failure
                # For now, just returning an error message.
    
    return Greeting(message=message) # Example response

app = restate.app(services=[greeter])
