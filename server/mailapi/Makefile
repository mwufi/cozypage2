
.PHONY: build run

build:
	docker build -t my-api .

run:
	docker run -p 8000:8000 --env-file .env my-api

test_db_connection:
	python test_db_connection.py