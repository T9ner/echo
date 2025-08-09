"""
Development server runner for ECHO AI Assistant
"""
import uvicorn
import sys

def start_server():
    """Start the FastAPI development server"""
    print("🚀 Starting ECHO AI Productivity Assistant API Server...")
    print("📍 Server will be available at:")
    print("   • API: http://localhost:8000")
    print("   • Interactive Docs: http://localhost:8000/docs")
    print("   • ReDoc: http://localhost:8000/redoc")
    print()
    print("🔄 Auto-reload is enabled - changes will restart the server")
    print("⏹️  Press Ctrl+C to stop the server")
    print("=" * 60)
    
    try:
        uvicorn.run(
            "app.main:app",
            host="127.0.0.1",  # Changed to localhost for clarity
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_server()