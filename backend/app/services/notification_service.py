import os
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
from app.models import InventoryItem, User

# Load environment variables from .env file
load_dotenv()

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")


def send_expiring_items_email(user_id: int):
    user = User.query.get(user_id)
    if not user or not user.email:
        print(f"❌ User not found or missing email: user_id={user_id}")
        return False

    today = datetime.utcnow().date()
    upcoming = today + timedelta(days=3)

    items = InventoryItem.query.filter_by(user_id=user_id).all()
    expiring_items = [
        item for item in items
        if item.expiration_date and today <= item.expiration_date <= upcoming
    ]

    if not expiring_items:
        print(f"ℹ️ No expiring items found for user {user.email}")
        return False

    # Plain text body
    item_list_text = "\n".join(
        f"- {item.name} (expires on {item.expiration_date.strftime('%Y-%m-%d')})"
        for item in expiring_items
    )
    text_body = f"""Hello {user.username},

The following items in your inventory are about to expire:

{item_list_text}

💡 Consider using them soon!
"""

    # HTML body
    item_list_html = "".join(
        f"<li>{item.name} – {item.expiration_date.strftime('%Y-%m-%d')}</li>"
        for item in expiring_items
    )
    html_body = f"""
    <html>
      <body>
        <p>Hello <b>{user.username}</b>,</p>
        <p>The following items in your inventory are about to expire:</p>
        <ul>
          {item_list_html}
        </ul>
        <p>💡 Consider using them soon!</p>
        <p style="font-size:12px;color:gray;">
          SmartCook – Cook smarter with what you already have 🧠🍳
        </p>
      </body>
    </html>
    """

    # Assemble email
    message = MIMEMultipart("alternative")
    message["Subject"] = "📢 Reminder: Items Expiring Soon"
    message["From"] = SMTP_USER
    message["To"] = user.email
    message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, user.email, message.as_string())
        print(f"✅ Email sent to {user.email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email to {user.email}:", e)
        return False
