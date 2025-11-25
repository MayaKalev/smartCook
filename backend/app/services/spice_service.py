from app.models import db, UserSpice
from datetime import datetime


def toggle_spice_for_user(user_id: int, spice_name: str) -> dict:
    """
    מוסיף או מוחק תבלין לפי המצב הקיים:
    - אם כבר קיים למשתמש – תימחק השורה.
    - אם לא קיים – יתווסף רשומה חדשה.
    """
    spice = UserSpice.query.filter_by(user_id=user_id, spice_name=spice_name).first()

    if spice:
        db.session.delete(spice)
        db.session.commit()
        return {"action": "deleted", "spice": spice_name}
    else:
        new_spice = UserSpice(user_id=user_id, spice_name=spice_name, added_at=datetime.utcnow())
        db.session.add(new_spice)
        db.session.commit()
        return {"action": "added", "spice": spice_name}


def get_spices_for_user(user_id: int) -> list[str]:
    """
    מחזיר רשימת שמות התבלינים של המשתמש
    """
    spices = UserSpice.query.filter_by(user_id=user_id).all()
    return [s.spice_name for s in spices]
