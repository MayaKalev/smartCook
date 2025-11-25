from . import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
from app.utils.recipe_hash import generate_recipe_hash  # אם יש צורך שימושי בעתיד

class RecipeRating(db.Model):
    __tablename__ = 'recipe_ratings'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    recipe_hash = db.Column(db.String(64), nullable=False)  # מזהה ייחודי למתכון
    rating = db.Column(db.Integer, nullable=False)  # 1 עד 5
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    title = db.Column(db.String(255), nullable=True)  # ← חדש

    user = db.relationship('User', backref=db.backref('recipe_ratings', lazy=True))

    def to_dict(self):
        return {
            "recipe_hash": self.recipe_hash,
            "rating": self.rating,
            "timestamp": self.timestamp.isoformat(),
        }



class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)

    first_name = db.Column(db.String(100))  # ✅ חדש
    last_name = db.Column(db.String(100))   # ✅ חדש
    image_url = db.Column(db.Text)          # ✅ חדש

    calorie_goal = db.Column(db.Float, nullable=True)
    protein_goal = db.Column(db.Float, nullable=True)
    carbs_goal = db.Column(db.Float, nullable=True)
    fat_goal = db.Column(db.Float, nullable=True)

    preferences = db.Column(JSON, nullable=True, default=dict)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)



class InventoryItem(db.Model):
    __tablename__ = 'inventory_items'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20))
    expiration_date = db.Column(db.Date, nullable=True)
    calories        = db.Column(db.Float)   # kcal
    protein         = db.Column(db.Float)   # g
    carbs           = db.Column(db.Float)   # g
    fat             = db.Column(db.Float)   # g
    avg_weight = db.Column(db.Float)

    # FK → users.id
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('inventory_items', lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "quantity": self.quantity,
            "unit": self.unit,
            "expiration_date": self.expiration_date.strftime('%Y-%m-%d') if self.expiration_date else None
        }
    
class SavedRecipe(db.Model):
    __tablename__ = 'saved_recipes'

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title        = db.Column(db.String(255), nullable=False)
    description  = db.Column(db.Text)
    difficulty   = db.Column(db.String(50))
    prep_minutes = db.Column(db.Integer)
    cook_minutes = db.Column(db.Integer)
    servings     = db.Column(db.Integer)
    ingredients  = db.Column(JSON)   # רשימה של dicts: {name, qty, unit}
    instructions = db.Column(JSON)   # רשימת צעדים (strings)
    dietary_tags = db.Column(JSON)   # תגיות דיאטה
    image_url    = db.Column(db.String(512))

    user = db.relationship('User', backref=db.backref('saved_recipes', lazy=True))

    def to_dict(self):
        return {
            "title": self.title,
            "description": self.description,
            "difficulty": self.difficulty,
            "prep_minutes": self.prep_minutes,
            "cook_minutes": self.cook_minutes,
            "servings": self.servings,
            "ingredients": self.ingredients,
            "instructions": self.instructions,
            "dietary_tags": self.dietary_tags,
            "image_url": self.image_url,
        }

class UserSpice(db.Model):
    __tablename__ = 'user_spices'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    spice_name = db.Column(db.String(100), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('user_spices', lazy=True))

    __table_args__ = (db.UniqueConstraint('user_id', 'spice_name', name='unique_user_spice'),)

    def to_dict(self):
        return {
            "id": self.id,
            "spice_name": self.spice_name,
            "added_at": self.added_at.isoformat()
        }
    
class NutritionLog(db.Model):
    __tablename__ = 'nutrition_log'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    recipe_hash = db.Column(db.String, nullable=False)  # ⬅️ במקום recipe_id
    date = db.Column(db.Date, default=datetime.utcnow, nullable=False)

    calories = db.Column(db.Float, nullable=True)
    protein = db.Column(db.Float, nullable=True)
    carbs = db.Column(db.Float, nullable=True)
    fat = db.Column(db.Float, nullable=True)

    user = db.relationship('User', backref=db.backref('nutrition_logs', lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "recipe_hash": self.recipe_hash,
            "date": self.date.isoformat(),
            "calories": self.calories,
            "protein": self.protein,
            "carbs": self.carbs,
            "fat": self.fat
        }

