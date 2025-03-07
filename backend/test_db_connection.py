import os
from app import create_app
from app.common.db import db
from sqlalchemy.sql import text

def test_db_connection():
    """Test the database connection and print the result."""
    app = create_app()
    
    with app.app_context():
        try:
            db.session.execute(text("SELECT 1"))  # Run a simple test query
            print("✅ Successfully connected to the database!")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")

if __name__ == "__main__":
    test_db_connection()
