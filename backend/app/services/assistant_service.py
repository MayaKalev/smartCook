from __future__ import annotations
import json, os, re, time, random
from typing import Any, List, Union, Dict
from dotenv import load_dotenv
from groq import Groq  # 👈 במקום openai
from app.utils.unit_normalizer import normalize_ingredient_units
from app.services.spice_service import get_spices_for_user
from app.services.rating_learning import summarize_user_ratings_for_prompt


# 🌟 טעינת משתני סביבה
load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))  # 👈 יצירת חיבור אמיתי ל-Groq
print("🔑 Loaded GROQ_API_KEY prefix:", os.getenv("GROQ_API_KEY")[:6])

# 🌿 רשימת מרכיבים אסורים לפי העדפה תזונתית
RESTRICTED = {
    "vegetarian": {"beef", "pork", "chicken", "turkey", "fish", "shrimp", "lamb", "bacon"},
    "vegan": {
        "beef", "pork", "chicken", "turkey", "fish", "shrimp", "lamb",
        "milk", "cheese", "butter", "yogurt", "cream", "egg", "honey",
    },
    "gluten free": {
        "wheat", "barley", "rye", "bread", "pasta", "flour",
        "spaghetti", "noodles", "bulgur", "couscous", "semolina",
    },
}

MAX_ATTEMPTS = 4
RETRY_DELAY = (0.6, 1.4)


# ============================================================
# 🧠 JSON helpers – חילוץ ותיקון JSON גם כשהוא שבור
# ============================================================

def _remove_json_comments(text: str) -> str:
    """מסיר הערות מסוג // ו-/* */ מתוך טקסט JSON-דמוי."""
    text = re.sub(r"//.*", "", text)
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return text.strip()


def _balanced_json_snippet(text: str) -> str | None:
    """מנסה למצוא קטע מאוזן ראשון של {...} מתוך הטקסט."""
    start = text.find("{")
    if start == -1:
        return None
    depth = 0
    for i, ch in enumerate(text[start:], start=start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start: i + 1]
    return None


def _try_parse_json_candidate(candidate: str) -> dict[str, Any] | None:
    candidate = candidate.strip()
    if not candidate:
        return None
    cleaned = _remove_json_comments(candidate)
    try:
        return json.loads(cleaned)
    except Exception:
        return None


def _extract_json(text: str) -> dict[str, Any] | None:
    """
    מנסה לחלץ JSON מתוך טקסט – גם אם יש טקסט לפני/אחרי,
    גם אם יש ```json, וגם אם יש הערות //.
    """
    if not text:
        return None

    # 1) נסה ישר על כל התגובה – אחרי ניקוי מרקרי markdown
    raw = text.replace("```json", "").replace("```", "").strip()
    parsed = _try_parse_json_candidate(raw)
    if parsed is not None:
        return parsed

    # 2) נסה למצוא קטע מאוזן {...}
    snippet = _balanced_json_snippet(raw)
    if snippet:
        parsed = _try_parse_json_candidate(snippet)
        if parsed is not None:
            return parsed

    # 3) נסה לחפש בלוקים של ```json ... ```
    for m in re.finditer(r"```json([\s\S]*?)```", text):
        candidate = m.group(1)
        parsed = _try_parse_json_candidate(candidate)
        if parsed is not None:
            return parsed

    return None


def _repair_json_via_groq(raw_text: str) -> dict[str, Any] | None:
    """
    אם Groq החזיר טקסט שאי אפשר לפרש כ-JSON,
    נבקש ממנו ספציפית 'הפוך את זה ל-JSON תקין'.
    """
    try:
        fix_prompt = (
            "Your previous response was not valid JSON.\n"
            "Here is the content:\n"
            "----------------\n"
            f"{raw_text}\n"
            "----------------\n\n"
            "Now respond with ONLY valid JSON. No explanations, no comments, no markdown."
        )

        res = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a JSON fixer. You always output VALID JSON only."
                },
                {"role": "user", "content": fix_prompt},
            ],
            temperature=0.0,
            max_tokens=900,
        )
        fixed_raw = res.choices[0].message.content
        print("🛠 Groq JSON FIX RAW:\n", fixed_raw)
        return _extract_json(fixed_raw)
    except Exception as e:
        print("❌ JSON fix via Groq failed:", e)
        return None


# ============================================================
# 🥕 לוגיקה של מרכיבים / דיאטה
# ============================================================

def _filter_inventory(inv: List[Any], dietary: List[str]) -> List[Any]:
    banned = set()
    for d in dietary:
        banned |= RESTRICTED.get(d.lower(), set())

    def _get_name(item: Any) -> str:
        return item if isinstance(item, str) else str(item.get("name", "")).lower()

    return [item for item in inv if _get_name(item) not in banned]


def _build_restriction_note(dietary: List[str]) -> str:
    notes = []
    dset = {d.lower() for d in dietary}
    if "vegan" in dset:
        notes.append("IMPORTANT: 100 % plant-based – no meat, fish, dairy or eggs. Use tofu/legumes instead.")
    elif "vegetarian" in dset:
        notes.append("IMPORTANT: No meat or fish. Use plant-based substitutes.")
    if "gluten free" in dset:
        notes.append("IMPORTANT: Must be 100 % gluten-free – no wheat, barley, rye or derivatives.")
    if "kosher" in dset:
        notes.append("IMPORTANT: Keep recipe kosher – no pork/shellfish; do not mix meat with dairy.")
    if "halal" in dset:
        notes.append("IMPORTANT: Keep recipe halal – no pork or alcohol.")
    if "keto" in dset:
        notes.append("IMPORTANT: Keep net carbs very low (< 20 g per serving); moderate protein, high fat.")
    if "paleo" in dset:
        notes.append("IMPORTANT: Paleo – no grains, legumes or processed sugar; focus on meat, fish, vegetables, fruit, nuts.")
    return " ".join(notes)


def _ing_to_str(item: Any) -> str:
    if isinstance(item, str):
        return item
    name = item.get("name", "")
    quantity = item.get("quantity")
    unit = item.get("unit")
    return f"{quantity} {unit} {name}".strip() if quantity and unit else str(name)


def _is_number(s: str) -> bool:
    try:
        float(s)
        return True
    except Exception:
        return False


def _normalize_ingredients_structure(ingredients: Any) -> List[Dict[str, Any]]:
    """
    דואג שתמיד נקבל רשימה של dict-ים:
    [{name, quantity?, unit?}, ...]
    אפילו אם Groq החזיר dict של name → "1.0 kg".
    """
    if isinstance(ingredients, list):
        # נניח שזה כבר בפורמט סביר
        return ingredients

    if isinstance(ingredients, dict):
        normalized: List[Dict[str, Any]] = []
        for name, raw_qty in ingredients.items():
            entry: Dict[str, Any] = {"name": name}
            if isinstance(raw_qty, (int, float)):
                entry["quantity"] = raw_qty
            elif isinstance(raw_qty, str):
                parts = raw_qty.split()
                if len(parts) >= 2 and _is_number(parts[0]):
                    entry["quantity"] = float(parts[0])
                    entry["unit"] = parts[1]
                else:
                    # נשמור את כל המחרוזת בתוך quantity, הנורמלייזר אולי ידע לטפל
                    entry["quantity"] = raw_qty
            else:
                entry["quantity"] = raw_qty
            normalized.append(entry)
        return normalized

    # אם זה משהו אחר, נחזיר רשימה ריקה
    return []


# ============================================================
# 🍳 הפונקציה הראשית – יצירת מתכונים מ-Groq
# ============================================================

def suggest_recipes_from_groq(
    user_id: int,
    ingredients: List[Union[str, Dict[str, Any]]],
    user_message: str,
    user_prefs: dict[str, Any],
    prev_recipe: dict[str, Any] | None = None,
    num_recipes: int = 3
) -> dict[str, Any]:
    dietary = [d.strip().lower() for d in user_prefs.get("dietary", [])]
    allergies = user_prefs.get("allergies", [])
    safe_inv = _filter_inventory(ingredients, dietary)

    if not safe_inv:
        return {"error": "No safe ingredients available.", "recipes": []}

    pref_txt = "; ".join(filter(None, [
        f"dietary restrictions: {', '.join(dietary)}" if dietary else "",
        f"allergies: {', '.join(allergies)}" if allergies else "",
    ])) or "no special preferences"

    ing_txt = ", ".join(_ing_to_str(i) for i in safe_inv)
    print("📦 INVENTORY FOR GROQ:", safe_inv)
    restriction_note = _build_restriction_note(dietary)
    rating_summary = summarize_user_ratings_for_prompt(user_id)

    user_spices = get_spices_for_user(user_id)
    spices_txt = ", ".join(user_spices) if user_spices else "no specific spices available"
    print("🌶️", spices_txt)

    temperature = 0.7 if any(w in user_message.lower() for w in ["surprise", "different"]) else 0.4
    last_error = ""

    # ✳️ הודעת SYSTEM אמיתית – לא טקסט בתוך user
    system_content = (
        "You are a helpful cooking assistant.\n"
        "You MUST reply with ONE VALID JSON object only.\n"
        "Rules:\n"
        "- Never output text before or after the JSON.\n"
        "- Never wrap JSON with ```json or any markdown.\n"
        "- Never use comments like // or /* */ inside JSON.\n"
        "- Allowed units: grams, kg, ml, l, pieces.\n"
        "- Use ONLY ingredients from the provided inventory.\n"
        "- Schema example:\n"
        "{\n"
        '  "recipes": [\n'
        "    {\n"
        '      "title": "string",\n'
        '      "ingredients": [ {"name": "string", "quantity": 100, "unit": "grams"} ],\n'
        '      "instructions": ["step 1", "step 2"]\n'
        "    }\n"
        "  ]\n"
        "}\n"
    )

    for attempt in range(1, MAX_ATTEMPTS + 1):
        print(f"🚀 Attempt {attempt} contacting Groq...")

        if prev_recipe:
            user_prompt = (
                f"User previously received this recipe: {prev_recipe.get('title', 'Unnamed')}.\n"
                f"User now says: {user_message}\n"
                f"Available ingredients: {ing_txt}\n"
                f"User preferences: {pref_txt}.\n"
            )
        else:
            user_prompt = (
                f"User message: {user_message}\n"
                f"Available ingredients: {ing_txt}\n"
                f"User preferences: {pref_txt}.\n"
            )

        user_prompt += (
            f"Available spices: {spices_txt}\n"
            f"{restriction_note}\n"
            f"{rating_summary}\n"
            f"Please return up to {num_recipes} recipes in the JSON schema described."
        )

        try:
            res = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=1100,
            )
            raw_content = res.choices[0].message.content
            print("✅ Groq RAW RESPONSE:\n", raw_content)
        except Exception as e:
            last_error = f"Groq API error ({e})"
            print("❌", last_error)
            if attempt < MAX_ATTEMPTS:
                time.sleep(random.uniform(*RETRY_DELAY))
                continue
            return {"error": last_error, "recipes": []}

        # 🔍 ניסיון ראשון: לחלץ JSON כמו שהוא
        parsed = _extract_json(raw_content)

        # אם עדיין None – נסה לבקש מהמודל שיתקן את עצמו
        if parsed is None:
            print("⚠️ Invalid JSON returned from Groq – trying JSON repair...")
            parsed = _repair_json_via_groq(raw_content)

        if parsed is None:
            last_error = "Invalid JSON returned from Groq"
            print("⚠️", last_error)
            if attempt < MAX_ATTEMPTS:
                time.sleep(random.uniform(*RETRY_DELAY))
                continue
            return {"error": last_error, "recipes": []}

        # 🟦 אם Groq החזיר "recipe" במקום "recipes"
        if "recipe" in parsed and isinstance(parsed["recipe"], dict):
            parsed = {"recipes": [parsed["recipe"]]}

        # 🟦 אם אין "recipes" – ננסה להתייחס לכל האובייקט כמתכון יחיד
        if "recipes" not in parsed or not isinstance(parsed["recipes"], list):
            parsed = {"recipes": [parsed]}

        normalized_input_recipes: List[Dict[str, Any]] = []

        for r in parsed["recipes"]:
            if not isinstance(r, dict):
                continue

            title = r.get("title") or r.get("name") or r.get("recipe_name") or "Untitled recipe"
            ingredients_raw = r.get("ingredients", [])
            instructions_raw = r.get("instructions") or r.get("steps") or []

            ingredients_norm = _normalize_ingredients_structure(ingredients_raw)

            if isinstance(instructions_raw, str):
                instructions = [instructions_raw]
            elif isinstance(instructions_raw, list):
                instructions = [str(step) for step in instructions_raw]
            else:
                instructions = [str(instructions_raw)]

            merged_recipe: Dict[str, Any] = dict(r)  # שמור שדות נוספים אם יש
            merged_recipe["title"] = title
            merged_recipe["ingredients"] = ingredients_norm
            merged_recipe["instructions"] = instructions

            normalized_input_recipes.append(merged_recipe)

        if not normalized_input_recipes:
            last_error = "No valid recipes returned"
            print("⚠️", last_error)
            if attempt < MAX_ATTEMPTS:
                time.sleep(random.uniform(*RETRY_DELAY))
                continue
            return {"error": last_error, "recipes": []}

        # הגבלת כמות מתכונים
        normalized_input_recipes = normalized_input_recipes[:num_recipes]

        # נורמליזציה של יחידות
        normalized = normalize_ingredient_units(normalized_input_recipes, user_id)

        print("\n🍳 === RECIPES GENERATED BY GROQ ===")
        for i, recipe in enumerate(normalized, start=1):
            print(f"{i}. {recipe.get('title', 'No title')} ({recipe.get('difficulty', 'Unknown')})")
        print("====================================\n")

        return {"user_id": user_id, "recipes": normalized}

    return {"error": f"Groq failed after {MAX_ATTEMPTS} attempts: {last_error}", "recipes": []}
