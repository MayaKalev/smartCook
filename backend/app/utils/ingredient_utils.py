from app.services.nutrition_service import fetch_nutrition_raw


# 🔹 סיווג לפי קטגוריית USDA
def classify_by_usda_category(category: dict | str) -> str:
    if isinstance(category, dict):
        category = category.get("description", "").lower()
    else:
        category = category.lower()

    if any(word in category for word in ["juice", "drink", "milk", "vinegar", "syrup", "water","soups, sauces, and sravies"]):
        return "liquid"
    if any(word in category for word in ["spice", "seasoning", "herb", "condiment","spices and herbs"]):
        return "spice"
    if any(word in category for word in ["fruit", "vegetable"]):
        return "fruit_And_Vegetable"
    if any(word in category for word in ["baked products","snacks",'sweets']):
        return "countable"
    if any(word in category for word in ["dairy and egg product"]):
        return "Dairy"
    return "solid"


# 🔸 סיווג ידני לפי שם רכיב – מחזיר (קטגוריה, האם נדרש תוקף)
def classify_ingredient(name: str) -> tuple[str, bool]:
    lowered = name.lower()


    liquids = {
        "milk","juice", "oil", "water", "syrup", "vinegar", "wine"
    }
    if lowered in liquids or any(liquid in lowered for liquid in liquids):
        return "liquid", True

    # פירות וירקות טריים – לא דורשים תוקף
    no_expiry_items = {
        "apple", "banana", "orange", "carrot", "onion", "tomato",
        "lemon", "lime", "avocado", "pepper", "cucumber", "potato",
        "clove", "garlic"
    }
    if lowered in no_expiry_items:
        return "fruit_And_Vegetable", False

    # מוצרי מאפה וביצים – דורשים תוקף
    baked_and_eggs = {
        "bread", "egg", "roll", "bun", "pita", "bagel"
    }
    if lowered in baked_and_eggs:
        return "countable", True

    # ברירת מחדל – מוצק שדורש תוקף
    return "solid", True


def is_expiry_required_by_category(category: str) -> bool:
    match category:
        case "fruit_And_Vegetable":
            return False
        case "liquid" | "solid"|"countable"| "Dairy":
            return True
        case _:
            return True
        
# ⚙️ יחידות מותרות לפי שם רכיב
def get_allowed_units(name: str) -> dict:
    lowered = name.lower()

    # חריגים – גם יחידות וגם גרמים
    if any(x in lowered for x in ["bread", "pita", "roll", "bun", "bagel"]):
        return {
            "units": ["pieces", "grams"],
            "category": "countable",
            "expiry_required": True
        }

    unit_categories = {
        "solid": ["grams", "kg"],
        "liquid": ["ml", "l"],
        "countable": ["pieces","grams", "kg"],
        "spice": ["grams"],
        "fruit_And_Vegetable": ["pieces"],
        "Dairy": ["grams", "kg"]

    }

    # סיווג ראשוני
    classification, expiry_required = classify_ingredient(lowered)

    # דיוק נוסף בעזרת USDA אם הסיווג הוא "solid"
    if classification == "solid":
        food = fetch_nutrition_raw(lowered)
        print(f"USDA category for '{name}': {food.get('foodCategory')}")
        if food and "foodCategory" in food:
            classification = classify_by_usda_category(food["foodCategory"])
            expiry_required = is_expiry_required_by_category(classification)
            # דרישת תוקף תיקבע לפי שם המקורי – לא לפי הסיווג בלבד
      
            

    units = unit_categories.get(classification, ["grams"])

    return {
        "units": units,
        "category": classification,
        "expiry_required": expiry_required
    }


# ⚖️ משקל ממוצע ליחידה (בגרמים)
AVERAGE_WEIGHT = {
    "tomato": 100,
    "orange": 130,
    "egg": 55,
    "onion": 110,
    "lemon": 120,
    "lime": 70,
    "banana": 120,
    "carrot": 70,
    "pepper": 100,
    "avocado": 150,
    "clove": 5,
    "garlic": 5,
    "apple": 180,
    "potato": 150,
    # ניתן להרחיב לפי הצורך
}


# 📏 שליפת משקל ממוצע
def get_average_weight(name: str) -> float | None:
    return AVERAGE_WEIGHT.get(name.lower())
