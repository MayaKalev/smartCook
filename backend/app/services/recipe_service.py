# app/services/recipe_service.py
from datetime import datetime
from datetime import timedelta
from app.models import InventoryItem
from app.services.assistant_service import suggest_recipes_from_groq
from app.services.saved_recipe_service import save_recipe
from app.services.global_cache import CACHE
from app.utils.recipe_hash import generate_recipe_hash
from app.utils.recipe_nutrition import calc_recipe_nutrition


# ------------------------------------------------------------------ #
def get_recommended_recipes(
    user_id: int,
    user_message: str,
    user_prefs: dict,
    save_to_db: bool = False,
    num_recipes: int = 3,
    use_cache: bool = True,          # ← NEW flag
    use_expiring_soon: bool = False,
    prev_recipe: dict = None 
    
) -> list[dict]:
    """
    Returns a list of recipes.  
    • Adds recipe_hash and nutrition.  
    • If use_cache=True it will reuse CACHE[user_id];  
      if False it will always call the LLM and refresh CACHE.
    """
    # ---------- Cache shortcut ----------
    if use_cache and user_id in CACHE and CACHE[user_id]:
        return CACHE[user_id]

    # ---------- Build inventory string ----------
    items = InventoryItem.query.filter_by(user_id=user_id).all()
    today = datetime.utcnow().date()
    if use_expiring_soon:
        # נכניס רק מוצרים שתוקפם בתוך 3 ימים מהיום
        inventory_items = [
            item for item in items
            if item.expiration_date and today <= item.expiration_date <= today + timedelta(days=3)
        ]
    else:
        # נכניס רק מוצרים תקפים (לא פגו תוקף)
        inventory_items = [
            item for item in items
            if not item.expiration_date or item.expiration_date >= today
        ]

    inventory = [
        {"name": item.name.lower(), "quantity": item.quantity, "unit": item.unit}
        for item in inventory_items
    ]



    recipes, seen_titles, best_partial = [], set(), []
    attempts, max_attempts = 0, 4


    # ---------- Talk to LLM (with retries) ----------
    while len(recipes) < num_recipes and attempts < max_attempts:
        print("📦 INVENTORY FOR GROQ:", inventory)
        result = suggest_recipes_from_groq(
            user_id=user_id,
            ingredients=inventory,
            user_message=user_message,
            user_prefs=user_prefs,
            prev_recipe=prev_recipe
        )

        if "error" in result:
            attempts += 1
            continue

        new_recipes = result.get("recipes", [])
        if not isinstance(new_recipes, list):
            new_recipes = [new_recipes]

        # -------- Fix possible string-lists --------
        for r in new_recipes:
            if isinstance(r.get("ingredients"), str):
                parts = [
                    tok.strip() for tok in r["ingredients"].split(",") if tok.strip()
                ]
                r["ingredients"] = [
                    {"quantity": 1, "unit": "pieces", "name": p} for p in parts
                ]

        # -------- Filter mandatory fields ----------
        REQUIRED = ["title", "ingredients", "instructions"]
        filtered = [
            r for r in new_recipes
            if isinstance(r, dict) and not [f for f in REQUIRED if not r.get(f)]
        ]
        if len(filtered) > len(best_partial):
            best_partial = filtered

        # -------- Enrich + collect ----------
        for recipe in filtered:
            title = recipe.get("title", "").strip().lower()
            if not title or title in seen_titles:
                continue

            # 1. hash
            recipe["recipe_hash"] = generate_recipe_hash(recipe)

            # 2. nutrition
            if isinstance(recipe.get("ingredients"), list):
                totals = calc_recipe_nutrition(recipe["ingredients"])
                if totals:
                    servings = max(int(recipe.get("servings") or 1), 1)
                    recipe["nutrition"] = {
                        "total": totals,
                        "per_serving": {
                            k: round(v / servings, 2) for k, v in totals.items()
                        },
                    }

            recipes.append(recipe)
            seen_titles.add(title)
            if len(recipes) >= num_recipes:
                break
        attempts += 1
        print("attempts:))))))))\n",attempts)      


    # ---------- Fallback if nothing full ----------
    if not recipes and best_partial:
        recipes = best_partial
    if not recipes:
        return []

    # ---------- Optional DB save ----------
    if save_to_db:
        for r in recipes:
            save_recipe(user_id, r)

    # ---------- Update / skip cache ----------
    if use_cache:
        CACHE[user_id] = recipes

    return recipes
