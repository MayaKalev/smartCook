from app.models import RecipeRating, db
from app.utils.recipe_hash import generate_recipe_hash

def rate_recipe(user_id: int, recipe: dict, rating: int) -> str:
    """
    שומר או מעדכן דירוג עבור מתכון מוצע – גם אם הוא לא נשמר בבסיס הנתונים.
    
    הפרמטרים:
    - user_id (int): מזהה המשתמש שמדרג
    - recipe (dict): המתכון כפי שמתקבל מה-Frontend (כולל title, ingredients, instructions וכו')
    - rating (int): ערך הדירוג (1–5)

    מחזיר:
    - recipe_hash (str): מזהה ייחודי למתכון המבוסס על תוכנו
    """

    # שלב 1 – הפקת מזהה ייחודי למתכון
    recipe_hash = generate_recipe_hash(recipe)

    # שלב 2 – בדיקה האם המשתמש כבר דירג את המתכון הזה
    existing_rating = RecipeRating.query.filter_by(user_id=user_id, recipe_hash=recipe_hash).first()

    # שלב 3 – עדכון או יצירה חדשה
    if existing_rating:
        existing_rating.rating = rating
    else:
        new_rating = RecipeRating(
            user_id=user_id,
            recipe_hash=recipe_hash,
            rating=rating,
            title=recipe.get("title")  # ← זה מוסיף את שם המתכון
        )
        db.session.add(new_rating)

    # שלב 4 – שמירה במסד הנתונים
    db.session.commit()

    return recipe_hash
