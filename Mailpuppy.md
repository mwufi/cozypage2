

Mailpuppy
===

Mailpuppy is an AI agent that does your mail for you.

It consists of several parts:

A frontend application where you can easily check the current status of your current tasks. You can see a summary of what happened when you last left, a dashboard that shows you your most important tasks, current open loops, people you talk to and more. 

A backend that handles email sync & enrichment.
- Lots in with google for you
- Receive realtime updates via push notifications webhook (as mentioned in https://developers.google.com/workspace/gmail/api/guides/push)
- Can schedule jobs like refreshing the latest threads, composing an ai-generated draft, or summarizing the current state of your email!

# Architecture

Right now, we have a Python server for backend (localhost:8000) and a client application (localhost:3000) in NextJS.

We have basic message fetching in our server, and can display messages in the client.

However, there's a few things missing:
- ability to run scheduled jobs
- separation of concerns between api layer (ie, our routes) and services layer (gmail, maybe db service in the future)

