"""
MenuPilot AI - Local Server Runner
Execute com: python main.py
Ou: uvicorn api.index:app --reload --port 8000
"""
import uvicorn

if __name__ == "__main__":
    print("🚀 Iniciando MenuPilot AI em http://127.0.0.1:8000 ...")
    uvicorn.run("api.index:app", host="127.0.0.1", port=8000, reload=True)

