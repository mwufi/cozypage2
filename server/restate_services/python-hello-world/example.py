import restate

from services.greeter_service import greeter
from services.openai_service import ai

app = restate.app(services=[greeter, ai])

