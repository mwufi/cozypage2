FROM python:3.11-slim

WORKDIR /usr/src/app

COPY restate_services/python-hello-world/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY shared /usr/src/app/shared
COPY restate_services/python-hello-world/ /usr/src/app/

EXPOSE 9080

ENV PYTHONPATH="/usr/src/app:/usr/src/app/shared"
CMD ["hypercorn", "example:app", "--config", "hypercorn-config.toml"]
