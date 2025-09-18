from datetime import datetime
import json

def introduce_myself():
    return {
        "agent": "Syd Prototipo",
        "message": "Ciao team! Analizzo documenti",
        "capabilities": ["PDF analysis", "Food safety", "Commercial docs"],
        "timestamp": datetime.now().isoformat()
    }

with open("my-introduction.json", "w") as f:
    json.dump(introduce_myself(), f, indent=2)