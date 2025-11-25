# app/services/user_service.py
from app.extensions import db
from app.models import User
import secrets
from werkzeug.security import generate_password_hash

DEFAULT_PREFS = {
    "dietary": [],
    "allergies": [],
    "additionalAllergies": "",
    "skillLevel": "",
    "mealPrep": "",
}

# ---------------------
# Preferences Logic
# ---------------------

def get_preferences(user_id: int) -> dict:
    user = User.query.get(user_id)
    return user.preferences if user and user.preferences else DEFAULT_PREFS.copy()


def set_preferences(user_id: int, data: dict) -> bool:
    user = User.query.get(user_id)
    if user is None:
        user = User(
            username=f"user{user_id}",
            email=f"user{user_id}@example.com",
            password_hash=secrets.token_hex(16),
            preferences=DEFAULT_PREFS.copy(),
        )
        db.session.add(user)

    user.preferences = data
    db.session.commit()
    return True

# ---------------------
# Profile Logic
# ---------------------

def get_profile(user_id):
    user = User.query.get(user_id)
    if not user:
        return None
    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "image": user.image_url,
        "calorie_goal": user.calorie_goal,
        "protein_goal": user.protein_goal,
        "carbs_goal": user.carbs_goal,
        "fat_goal": user.fat_goal
    }


def update_profile(user_id, data):
    user = User.query.get(user_id)
    if not user:
        return False

    user.first_name = data.get("first_name", user.first_name)
    user.last_name = data.get("last_name", user.last_name)
    user.email = data.get("email", user.email)

    password = data.get("password")
    if password:
        user.password_hash = password

    user.image_url = data.get("image_url", user.image_url) or data.get("image", user.image_url)

    # 👇 המרה חכמה לשדות מספריים (מאפשר NULL)
    def parse_number(val):
        try:
            return float(val) if val not in [None, ""] else None
        except (ValueError, TypeError):
            return None

    user.calorie_goal = parse_number(data.get("calorie_goal"))
    user.protein_goal = parse_number(data.get("protein_goal"))
    user.carbs_goal = parse_number(data.get("carbs_goal"))
    user.fat_goal = parse_number(data.get("fat_goal"))

    db.session.commit()
    return True




