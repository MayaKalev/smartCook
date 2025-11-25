"""init users & inventory_items tables

Revision ID: 950a69e782c4
Revises: 84e2caac51d7
Create Date: 2025-05-15 12:45:23.021737

This revision removes obsolete recipe‑related tables and
converts `users.preferences` from TEXT → JSON safely.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "950a69e782c4"
down_revision = "84e2caac51d7"
branch_labels = None
depends_on = None


def upgrade():
    """Apply schema changes."""

    # --- 1️⃣  remove recipe tables (saved_recipes ➜ recipes) ---
    op.drop_table("saved_recipes")  # drop child first (removes FK)
    op.drop_table("recipes")        # now parent can be dropped

    # --- 2️⃣  inventory_items.expiration_date becomes NOT NULL ---
    with op.batch_alter_table("inventory_items") as batch_op:
        batch_op.alter_column(
            "expiration_date",
            existing_type=sa.DATE(),
            nullable=False,
        )

    # --- 3️⃣  users.preferences  TEXT → JSON  (preserve existing JSON strings) ---
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column(
            "preferences",
            existing_type=sa.TEXT(),
            type_=postgresql.JSON(astext_type=sa.Text()),
            existing_nullable=True,
            postgresql_using="preferences::json",  # cast safely
        )


def downgrade():
    """Revert schema changes (drop JSON → TEXT, recreate tables)."""

    # --- revert users.preferences JSON → TEXT ---
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column(
            "preferences",
            existing_type=postgresql.JSON(astext_type=sa.Text()),
            type_=sa.TEXT(),
            existing_nullable=True,
        )

    # --- inventory_items.expiration_date back to nullable ---
    with op.batch_alter_table("inventory_items") as batch_op:
        batch_op.alter_column(
            "expiration_date",
            existing_type=sa.DATE(),
            nullable=True,
        )

    # --- recreate dropped tables (recipes, saved_recipes) ---
    op.create_table(
        "recipes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("image_url", sa.String(length=255)),
        sa.Column("cook_time", sa.Integer()),
        sa.Column("created_at", sa.DateTime()),
    )

    op.create_table(
        "saved_recipes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"]),
        sa.UniqueConstraint("user_id", "recipe_id", name="uq_user_recipe"),
    )
