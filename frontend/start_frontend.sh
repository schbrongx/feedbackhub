#!/bin/bash

# Activate virtual environment if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Start Uvicorn with the specified settings
uvicorn main_frontend:app --host 0.0.0.0 --port 8000 --reload

