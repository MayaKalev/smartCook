from app.models import SavedRecipe
from app.extensions import db

def save_recipe(user_id: int, recipe: dict) -> None:
    if SavedRecipe.query.filter_by(user_id=user_id, title=recipe["title"]).first():
        return  # לא לשמור שוב אם קיים
    new_recipe = SavedRecipe(
        user_id=user_id,
        title=recipe.get("title", "Untitled Recipe"),
        description=recipe.get("description", ""),
        difficulty=recipe.get("difficulty", "Medium"),
        prep_minutes=recipe.get("prep_minutes", 0),
        cook_minutes=recipe.get("cook_minutes", 0),
        servings=recipe.get("servings", 1),
        ingredients=recipe.get("ingredients", []),
        instructions=recipe.get("instructions", []),
        dietary_tags=recipe.get("dietary_tags", []),
        image_url=recipe.get("image_url")
    )
    db.session.add(new_recipe)
    db.session.commit()

def delete_saved_recipe(user_id: int, title: str) -> None:
    SavedRecipe.query.filter_by(user_id=user_id, title=title).delete()
    db.session.commit()

def get_saved_recipes(user_id: int) -> list[dict]:
    return [r.to_dict() for r in SavedRecipe.query.filter_by(user_id=user_id).all()]
