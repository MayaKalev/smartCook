# backend/utils/recipe_hash.py
import hashlib
import json

def generate_recipe_hash(recipe: dict) -> str:
    title = recipe.get("title", "").strip().lower()
    return hashlib.md5(title.encode()).hexdigest()

