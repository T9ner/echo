# Local AI Setup Guide for ECHO

This guide will help you set up local AI models for ECHO using Ollama, eliminating the need for monthly OpenAI payments.

## Prerequisites

1. **Install Ollama** (Free local AI runtime):
   - Visit: https://ollama.ai/
   - Download and install for your operating system
   - Windows: Download the installer and run it
   - The installer will add Ollama to your PATH

## Quick Setup

### Step 1: Install Ollama
```bash
# Download from https://ollama.ai/ and install
# Or on Windows with winget:
winget install Ollama.Ollama
```

### Step 2: Start Ollama Service
```bash
# Ollama should start automatically, but you can start it manually:
ollama serve
```

### Step 3: Install AI Models
Choose one of these models (start with the smaller one):

```bash
# Option 1: Small, fast model (1.6GB) - Recommended for starting
ollama pull gemma2:2b

# Option 2: Larger, more capable model (5.4GB) - Better responses
ollama pull gemma2:9b

# Option 3: Alternative model (4.7GB)
ollama pull llama3:8b
```

### Step 4: Test the Setup
```bash
# Test that the model is working
ollama run gemma2:2b "Hello, how are you?"
```

### Step 5: Configure ECHO
Your `.env` file is already configured for local AI:
```
USE_LOCAL_AI=true
OLLAMA_HOST=http://localhost:11434
LOCAL_AI_MODEL=gemma2:2b
```

### Step 6: Restart ECHO Backend
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Model Recommendations

| Model | Size | Speed | Quality | Best For |
|-------|------|--------|---------|----------|
| `gemma2:2b` | 1.6GB | Fast | Good | Getting started, quick responses |
| `gemma2:9b` | 5.4GB | Medium | Excellent | Best balance of quality/performance |
| `llama3:8b` | 4.7GB | Medium | Very Good | Alternative option |

## Troubleshooting

### Ollama Not Found
- Make sure Ollama is installed and in your PATH
- Restart your terminal after installation
- Try running `ollama --version`

### Models Not Downloading
- Check your internet connection
- Models are large files (1-5GB each)
- Download may take 10-30 minutes depending on speed

### Server Not Starting
- Check if port 11434 is available
- Try `ollama serve` manually
- Look for error messages in the output

### Chat Not Working
1. Verify Ollama is running: `ollama list`
2. Test model directly: `ollama run gemma2:2b "test"`
3. Check ECHO backend logs for errors
4. Ensure `.env` has `USE_LOCAL_AI=true`

## Switching Models

To use a different model, update your `.env` file:
```bash
# Change this line:
LOCAL_AI_MODEL=gemma2:9b  # or llama3:8b
```

Then restart the ECHO backend.

## Performance Tips

- **Smaller models** (2b): Faster responses, lower resource usage
- **Larger models** (9b): Better understanding, more detailed responses
- **RAM usage**: Models use 2-8GB RAM while running
- **CPU**: Local models use CPU, not GPU (unless you have CUDA setup)

## Advantages of Local AI

✅ **No monthly costs** - Run indefinitely for free  
✅ **Privacy** - Your data never leaves your machine  
✅ **No internet required** - Works offline  
✅ **No rate limits** - Use as much as you want  
✅ **Customizable** - Switch models anytime  

## Next Steps

1. Start with `gemma2:2b` for quick setup
2. Test the chat interface in ECHO frontend
3. If you want better responses, upgrade to `gemma2:9b`
4. All your conversations stay private on your machine!

## Advanced Setup (Optional)

### Multiple Models
You can install multiple models and switch between them:
```bash
ollama pull gemma2:2b
ollama pull gemma2:9b
ollama pull llama3:8b
```

### Custom System Prompts
Edit `chat_service.py` to customize how ECHO responds.

### GPU Acceleration (Advanced)
If you have a compatible GPU, Ollama can use it automatically for faster responses.

---

🎉 **Enjoy free, private AI assistance with ECHO!**
