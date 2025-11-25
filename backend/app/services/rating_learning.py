from app.models import RecipeRating  # טוען את טבלת דירוגי מתכונים מה־DB
from sqlalchemy import desc         # מאפשר למיין לפי דירוג מהגבוה לנמוך

def summarize_user_ratings_for_prompt(user_id: int, max_items: int = 5) -> str:
    """
    מחלץ תקציר טעמים מתוך דירוגי משתמש – אילו מתכונים אהב ולא אהב.
    הטקסט שיווצר מיועד להישלח כחלק מה-prompt ל-AI.
    """

    # 🟢 שלב 1: שליפת מתכונים עם דירוג גבוה (אהב)
    liked = (
        RecipeRating.query
        .filter_by(user_id=user_id)                 # רק דירוגים של המשתמש הזה
        .filter(RecipeRating.rating >= 4)           # רק מתכונים עם דירוג 4 ומעלה
        .order_by(desc(RecipeRating.rating))        # מסודר מהגבוה לנמוך
        .limit(max_items)                           # עד 5 מתכונים
        .all()
    )

    # 🔴 שלב 2: שליפת מתכונים עם דירוג נמוך (לא אהב)
    disliked = (
        RecipeRating.query
        .filter_by(user_id=user_id)                 # שוב לפי המשתמש
        .filter(RecipeRating.rating <= 2)           # רק מתכונים עם דירוג 1 או 2
        .order_by(RecipeRating.rating)              # מהנמוך לגבוה
        .limit(max_items)
        .all()
    )

    # 📝 שלב 3: הרכבת משפט באנגלית שמתאר את ההעדפות
    summary = ""  # נתחיל ממחרוזת ריקה

    if liked:
        liked_titles = [r.title or "Unnamed Recipe" for r in liked]
        summary += "The user liked: " + ", ".join(liked_titles) + ".\n"

    if disliked:
        disliked_titles = [r.title or "Unnamed Recipe" for r in disliked]
        summary += "The user disliked: " + ", ".join(disliked_titles) + "."

    # 🧼 מחזיר את הטקסט הסופי בלי רווחים מיותרים
    return summary.strip()
