"""
Quick server health check before starting
"""
import sys

def check_imports():
    """Check if all required modules can be imported"""
    print("🔍 Checking server dependencies...")
    
    try:
        print("   • FastAPI...", end=" ")
        import fastapi
        print("✅")
        
        print("   • Uvicorn...", end=" ")
        import uvicorn
        print("✅")
        
        print("   • SQLAlchemy...", end=" ")
        import sqlalchemy
        print("✅")
        
        print("   • Pydantic...", end=" ")
        import pydantic
        print("✅")
        
        print("   • App modules...", end=" ")
        from app.main import app
        print("✅")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_database():
    """Check if database connection works"""
    print("\n🗄️ Checking database connection...")
    
    try:
        from app.core.database import engine
        from sqlalchemy import text
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        
        print("   • Database connection: ✅")
        return True
        
    except Exception as e:
        print(f"   • Database connection: ❌ {e}")
        print("   💡 Make sure PostgreSQL is running and .env is configured")
        return False

def main():
    """Run all checks"""
    print("🏥 ECHO AI Server Health Check")
    print("=" * 40)
    
    imports_ok = check_imports()
    db_ok = check_database()
    
    print("\n📊 RESULTS:")
    print(f"   • Dependencies: {'✅' if imports_ok else '❌'}")
    print(f"   • Database: {'✅' if db_ok else '❌'}")
    
    if imports_ok and db_ok:
        print("\n🎉 All checks passed! Server is ready to start.")
        print("💡 Run: python run.py")
        return True
    else:
        print("\n⚠️ Some checks failed. Fix issues before starting server.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)