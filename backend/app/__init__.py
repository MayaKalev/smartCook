from flask import Flask
from flask_cors import CORS
from app.extensions import db, migrate, jwt
import os
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
from app.services.notification_service import send_expiring_items_email
from app.models import User
from dotenv import load_dotenv

# Blueprint imports
from app.routes.rating_routes import rating_bp
from app.routes.assistant_routes    import assistant_bp
from app.routes.auth_routes         import auth_bp
from app.routes.inventory_routes    import inventory_bp
from app.routes.recipe_routes       import recipe_bp
from app.routes.user_routes         import user_bp
from app.routes.barcode_routes      import barcode_bp
from app.routes.scan_routes         import scan_bp
from app.routes.ingredient_routes   import ingredient_bp
from app.routes.spice_routes        import spice_bp
from app.routes.recipe_usage_routes import recipe_usage_bp
from app.routes.nutrition_routes    import nutrition_bp

load_dotenv()

def create_app():
    app = Flask(__name__)
    

    # Base config
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    'postgresql://postgres:smartcook1@db.ffrkxbwlszpwsadkabgk.supabase.co:5432/postgres'
    )

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key')

    # ✅ CORS config
    CORS(app, resources={r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }})
    print("✅ CORS configuration loaded!")

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Register Blueprints
    app.register_blueprint(assistant_bp,    url_prefix='/api')
    app.register_blueprint(auth_bp,         url_prefix='/api/auth')
    app.register_blueprint(inventory_bp,    url_prefix='/api/inventory')
    app.register_blueprint(recipe_bp,       url_prefix='/api/recipes')
    app.register_blueprint(user_bp,         url_prefix='/api')
    app.register_blueprint(rating_bp,       url_prefix='/api')
    app.register_blueprint(barcode_bp,      url_prefix="/api")
    app.register_blueprint(scan_bp,         url_prefix="/api")
    app.register_blueprint(ingredient_bp,   url_prefix="/api/ingredient")
    app.register_blueprint(spice_bp,        url_prefix="/api/spices")
    app.register_blueprint(recipe_usage_bp, url_prefix="/api/use-recipe")
    app.register_blueprint(nutrition_bp,    url_prefix="/api/nutrition")
   

    # 🕒 Scheduler: שליחת מיילים אוטומטית כל יום ב־10:00
    scheduler = BackgroundScheduler()

    def send_daily_emails():
        with app.app_context():
            users = User.query.all()
            for user in users:
                send_expiring_items_email(user.id)

    scheduler.add_job(send_daily_emails, 'cron', hour=12, minute=37)
    scheduler.start()

    atexit.register(lambda: scheduler.shutdown())

    return app